import { Request, Response } from 'express';
import { updateOrderStatus } from '../services/order.service';
import {
    cancelDraftOrder,
    finalizeDraftOrder,
    getDraft,
} from '../services/draftOrder.service';
import {
    createPayPalPayment,
    executePayPalPayment,
    createVNPayPayment,
    verifyVNPayReturn,
    verifyVNPayIpn,
} from '../services/payment.service';
import {
    createPendingPayment,
    completePendingPayment,
    cancelPendingPayment,
    getPendingPaymentsForUser,
    getPendingPaymentByDraftId,
} from '../services/pendingPayment.service';
import Product from '../models/Product';
import { ReturnQueryFromVNPay } from 'vnpay';

// ─── Helpers ───────────────────────────────────────────────────────────────────

const getBaseUrl = (req: Request) => `${req.protocol}://${req.get('host')}`;

const getClientIp = (req: Request): string => {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
        const first = Array.isArray(forwarded) ? forwarded[0] : forwarded;
        return first.split(',')[0].trim();
    }
    return req.socket?.remoteAddress || req.ip || '127.0.0.1';
};

/** One DB query to get product names for all items in a draft. */
const buildProductNamesMap = async (productIds: string[]): Promise<Map<string, string>> => {
    const products = await Product.find({ _id: { $in: productIds } }).select('name').lean();
    return new Map(products.map((p) => [p._id.toString(), p.name]));
};

// ─── GET /api/payments/pending ─────────────────────────────────────────────────

export const getMyPendingPayments = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.sub;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });
        const pending = await getPendingPaymentsForUser(userId);
        return res.status(200).json(pending);
    } catch (error) {
        console.error('Get pending payments error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// ─── PayPal ────────────────────────────────────────────────────────────────────

/**
 * POST /api/payments/paypal/create-order/:draftId
 * Initiates PayPal checkout and saves a PendingPayment record so the user
 * can resume if they close the browser.
 */
export const payWithPayPal = async (req: Request, res: Response) => {
    console.log('[PayPal] Initiating payment for draft:', req.params.draftId);
    try {
        const { draftId } = req.params;
        const customerId = req.user?.sub;
        if (!customerId) return res.status(401).json({ message: 'Unauthorized' });

        const draft = await getDraft(draftId as string);
        if (!draft || draft.customerId !== customerId) {
            return res.status(404).json({ message: 'Draft not found' });
        }
        if (draft.paymentMethod !== 'paypal') {
            return res.status(400).json({ message: 'PayPal is not the selected payment method' });
        }

        const productNames = await buildProductNamesMap(draft.items.map((i) => i.productId));
        await createPendingPayment(customerId, draft, productNames);

        const approvalUrl = await createPayPalPayment(draft, getBaseUrl(req));
        return res.status(200).json({ approval_url: approvalUrl });
    } catch (error) {
        console.error('[PayPal] Create payment error:', error);
        return res.status(500).json({ message: 'Failed to initiate PayPal payment' });
    }
};

/**
 * POST /api/payments/paypal/resume/:draftId
 * Generates a fresh PayPal approval URL for an existing pending payment.
 * Used when the user returns after closing the browser.
 */
export const resumePayPalPayment = async (req: Request, res: Response) => {
    try {
        const { draftId } = req.params;
        const customerId = req.user?.sub;
        if (!customerId) return res.status(401).json({ message: 'Unauthorized' });

        const pending = await getPendingPaymentByDraftId(draftId as string, customerId);
        if (!pending) return res.status(404).json({ message: 'Pending payment not found' });
        if (pending.status !== 'awaiting_payment') {
            return res.status(400).json({ message: `Cannot resume a payment with status: ${pending.status}` });
        }

        const draft = await getDraft(draftId as string);
        if (!draft) {
            await cancelPendingPayment(draftId as string);
            return res.status(410).json({ message: 'Payment session expired. Please start a new checkout.' });
        }

        const approvalUrl = await createPayPalPayment(draft, getBaseUrl(req));
        return res.status(200).json({ approval_url: approvalUrl });
    } catch (error) {
        console.error('[PayPal] Resume error:', error);
        return res.status(500).json({ message: 'Failed to resume PayPal payment' });
    }
};

/**
 * GET /api/payments/paypal/success
 */
export const payPalSuccess = async (req: Request, res: Response) => {
    console.log('[PayPal] Success callback. Query:', req.query);
    try {
        const { paymentId, PayerID, draftId } = req.query;
        if (!paymentId || !PayerID || !draftId) {
            return res.status(400).json({ message: 'Missing required PayPal parameters' });
        }

        const payment = await executePayPalPayment(paymentId as string, PayerID as string);
        if (payment.state === 'approved') {
            const result = await finalizeDraftOrder(draftId as string);
            await updateOrderStatus(result.order._id.toString(), 'processing', 'paid');
            await completePendingPayment(draftId as string, result.order._id.toString());

            const frontendUrl = 'http://localhost:5173';
            return res.redirect(`${frontendUrl}/checkout/success?orderId=${result.order._id}`);
        }

        return res.status(400).json({ message: 'Payment not approved' });
    } catch (error) {
        console.error('[PayPal] Success error:', error);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        return res.redirect(`${frontendUrl}/checkout?error=payment_failed`);
    }
};

/**
 * GET /api/payments/paypal/cancel
 * Restores stock by cancelling the draft.
 */
export const payPalCancel = async (req: Request, res: Response) => {
    console.log('[PayPal] Cancel callback. Query:', req.query);
    try {
        const { draftId } = req.query;
        if (draftId) {
            try {
                await cancelDraftOrder(draftId as string);
                await cancelPendingPayment(draftId as string);
                console.log(`[PayPal] Draft ${draftId} cancelled, stock restored`);
            } catch (err) {
                console.error(`[PayPal] Failed to cancel draft ${draftId}:`, err);
            }
        }
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        return res.redirect(`${frontendUrl}/checkout?error=payment_cancelled`);
    } catch (error) {
        console.error('[PayPal] Cancel error:', error);
        return res.status(500).json({ message: 'Error processing cancellation' });
    }
};

// ─── VNPay ─────────────────────────────────────────────────────────────────────

/**
 * POST /api/payments/vnpay/create-order/:draftId
 * Initiates VNPay checkout and saves a PendingPayment record.
 */
export const payWithVNPay = async (req: Request, res: Response) => {
    console.log('[VNPay] Initiating payment for draft:', req.params.draftId);
    try {
        const { draftId } = req.params;
        const customerId = req.user?.sub;
        if (!customerId) return res.status(401).json({ message: 'Unauthorized' });

        const draft = await getDraft(draftId as string);
        if (!draft || draft.customerId !== customerId) {
            return res.status(404).json({ message: 'Draft not found' });
        }
        if (draft.paymentMethod !== 'vnpay') {
            return res.status(400).json({ message: 'VNPay is not the selected payment method' });
        }

        const productNames = await buildProductNamesMap(draft.items.map((i) => i.productId));
        await createPendingPayment(customerId, draft, productNames);

        const paymentUrl = createVNPayPayment(draft, getClientIp(req), getBaseUrl(req));
        return res.status(200).json({ payment_url: paymentUrl });
    } catch (error) {
        console.error('[VNPay] Create payment error:', error);
        return res.status(500).json({ message: 'Failed to initiate VNPay payment' });
    }
};

/**
 * POST /api/payments/vnpay/resume/:draftId
 * Generates a fresh VNPay payment URL for an existing pending payment.
 */
export const resumeVNPayPayment = async (req: Request, res: Response) => {
    try {
        const { draftId } = req.params;
        const customerId = req.user?.sub;
        if (!customerId) return res.status(401).json({ message: 'Unauthorized' });

        const pending = await getPendingPaymentByDraftId(draftId as string, customerId);
        if (!pending) return res.status(404).json({ message: 'Pending payment not found' });
        if (pending.status !== 'awaiting_payment') {
            return res.status(400).json({ message: `Cannot resume a payment with status: ${pending.status}` });
        }

        const draft = await getDraft(draftId as string);
        if (!draft) {
            await cancelPendingPayment(draftId as string);
            return res.status(410).json({ message: 'Payment session expired. Please start a new checkout.' });
        }

        const paymentUrl = createVNPayPayment(draft, getClientIp(req), getBaseUrl(req));
        return res.status(200).json({ payment_url: paymentUrl });
    } catch (error) {
        console.error('[VNPay] Resume error:', error);
        return res.status(500).json({ message: 'Failed to resume VNPay payment' });
    }
};

/**
 * GET /api/payments/vnpay/return
 */
export const vnpayReturn = async (req: Request, res: Response) => {
    console.log('[VNPay] Return callback. Query:', req.query);
    try {
        const query = req.query as ReturnQueryFromVNPay;
        const verification = verifyVNPayReturn(query);
        const draftId = query.vnp_TxnRef as string;
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

        if (!verification.isSuccess) {
            console.log('[VNPay] Verification failed:', verification.message);
            if (draftId) {
                try {
                    await cancelDraftOrder(draftId);
                    await cancelPendingPayment(draftId);
                } catch (err) {
                    console.error('[VNPay] Failed to cancel draft:', err);
                }
            }
            return res.redirect(
                `${frontendUrl}/checkout?error=payment_failed&vnp_ResponseCode=${query.vnp_ResponseCode ?? ''}`
            );
        }

        console.log('[VNPay] Payment verified. Finalizing draft:', draftId);
        const result = await finalizeDraftOrder(draftId);
        await updateOrderStatus(result.order._id.toString(), 'processing', 'paid');
        await completePendingPayment(draftId, result.order._id.toString());

        return res.redirect(`${frontendUrl}/checkout/success?orderId=${result.order._id}`);
    } catch (error) {
        console.error('[VNPay] Return error:', error);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        return res.redirect(`${frontendUrl}/checkout?error=payment_failed`);
    }
};

/**
 * POST /api/payments/vnpay/ipn
 * Server-to-server notification — idempotent.
 */
export const vnpayIpn = async (req: Request, res: Response) => {
    console.log('[VNPay] IPN received. Query:', req.query);
    try {
        const query = req.query as ReturnQueryFromVNPay;
        const verification = verifyVNPayIpn(query);

        if (!verification.isSuccess) {
            return res.status(200).json({ RspCode: '97', Message: 'Invalid signature' });
        }

        const draftId = query.vnp_TxnRef as string;
        const draft = await getDraft(draftId);
        if (!draft) {
            return res.status(200).json({ RspCode: '02', Message: 'Order already confirmed' });
        }

        const result = await finalizeDraftOrder(draftId);
        await updateOrderStatus(result.order._id.toString(), 'processing', 'paid');
        await completePendingPayment(draftId, result.order._id.toString());

        return res.status(200).json({ RspCode: '00', Message: 'Success' });
    } catch (error) {
        console.error('[VNPay] IPN error:', error);
        return res.status(200).json({ RspCode: '99', Message: 'Unknown error' });
    }
};