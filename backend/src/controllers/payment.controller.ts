import { Request, Response } from 'express';
import { updateOrderStatus } from '../services/order.service';
import {
  cancelDraftOrder,
  finalizeDraftOrder,
  getDraft,
} from '../services/draftOrder.service';
import { createPayPalPayment, executePayPalPayment } from '../services/payment.service';
import { createVNPayPayment, verifyVNPayReturn, verifyVNPayIpn } from '../services/payment.service';
import { ReturnQueryFromVNPay } from 'vnpay';

// Helper to construct the base URL for callbacks
const getBaseUrl = (req: Request) => {
    const protocol = req.protocol;
    const host = req.get('host');
    return `${protocol}://${host}`;
};

// POST /api/payments/paypal/create-order/:orderId
export const payWithPayPal = async (req: Request, res: Response) => {
    console.log('[DEBUG - PayPal] Initiating payWithPayPal');
    console.log('[DEBUG - PayPal] Draft ID:', req.params.draftId);

    try {
        const { draftId } = req.params;
        const customerId = req.user?.sub;

        if (!customerId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const draft = await getDraft(draftId as string);
        if (!draft || draft.customerId !== customerId) {
            return res.status(404).json({ message: 'Draft not found' });
        }

        if (draft.paymentMethod !== 'paypal') {
            return res.status(400).json({ message: 'PayPal is not the selected payment method' });
        }

        console.log('[DEBUG - PayPal] Calling createPayPalPayment service...');
        const approvalUrl = await createPayPalPayment(draft, getBaseUrl(req));

        console.log('[DEBUG - PayPal] Payment created. Sending approval URL to client:', approvalUrl);
        return res.status(200).json({ approval_url: approvalUrl });
    } catch (error) {
        console.error('PayPal create payment error:', error);
        return res.status(500).json({ message: 'Failed to initiate PayPal payment' });
    }
};

// GET /api/payments/paypal/success
export const payPalSuccess = async (req: Request, res: Response) => {
    console.log('[DEBUG - PayPal] PayPal Success Callback Triggered!');
    console.log('[DEBUG - PayPal] Query Params:', req.query);

    try {
        const { paymentId, PayerID, draftId } = req.query;

        if (!paymentId || !PayerID || !draftId) {
            console.log('[DEBUG - PayPal] Missing required parameters. Aborting.');
            return res.status(400).json({ message: 'Missing required PayPal parameters' });
        }

        console.log('[DEBUG - PayPal] Executing payment...');
        const payment = await executePayPalPayment(paymentId as string, PayerID as string);

        console.log('[DEBUG - PayPal] Payment executed. State:', payment.state);

        if (payment.state === 'approved') {
            console.log('[DEBUG - PayPal] Finalizing draft order...');
            const result = await finalizeDraftOrder(draftId as string);
            await updateOrderStatus(result.order._id.toString(), 'processing', 'paid');

            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            return res.redirect(`${frontendUrl}/checkout/success?orderId=${result.order._id}`);
        }

        return res.status(400).json({ message: 'Payment not approved' });
    } catch (error) {
        console.error('PayPal success error:', error);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        return res.redirect(`${frontendUrl}/checkout?error=payment_failed`);
    }
};

// GET /api/payments/paypal/cancel
export const payPalCancel = async (req: Request, res: Response) => {
    console.log('[DEBUG - PayPal] PayPal Cancel Callback Triggered!');
    console.log('[DEBUG - PayPal] Query Params:', req.query);

    try {
        const { draftId } = req.query;
        if (draftId) {
            console.log(`[DEBUG - PayPal] Cancelling draft ${draftId} due to payment cancellation`);
            try {
                await cancelDraftOrder(draftId as string);
                console.log(`[DEBUG - PayPal] Draft ${draftId} cancelled successfully`);
            } catch (cancelError) {
                console.error(`[DEBUG - PayPal] Failed to cancel draft ${draftId}:`, cancelError);
            }
        }

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        return res.redirect(`${frontendUrl}/checkout?error=payment_cancelled`);
    } catch (error) {
        console.error('PayPal cancel error:', error);
        return res.status(500).json({ message: 'Error processing cancellation' });
    }
};

//VNPAY 
const getClientIp = (req: Request): string => {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
        const first = Array.isArray(forwarded) ? forwarded[0] : forwarded;
        return first.split(',')[0].trim();
    }
    return (
        req.socket?.remoteAddress ||
        req.ip ||
        '127.0.0.1'
    );
};

const getBaseUrlVNPay = (req: Request): string =>
    `${req.protocol}://${req.get('host')}`;

/**
 * POST /api/payments/vnpay/create-order/:draftId
 * Creates a VNPay payment URL for the given draft and returns it to the client.
 */

export const payWithVNPay = async (req: Request, res: Response) => {
    console.log('[VNPay] Initiating payment for draft:', req.params.draftId);

    try {
        const { draftId } = req.params;
        const customerId = req.user?.sub;

        if (!customerId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const draft = await getDraft(draftId as string);
        if (!draft || draft.customerId !== customerId) {
            return res.status(404).json({ message: 'Draft not found' });
        }

        if (draft.paymentMethod !== 'vnpay') {
            return res
                .status(400)
                .json({ message: 'VNPay is not the selected payment method' });
        }

        const ipAddr = getClientIp(req);
        const paymentUrl = createVNPayPayment(draft, ipAddr, getBaseUrl(req));

        console.log('[VNPay] Payment URL created, sending to client');
        return res.status(200).json({ payment_url: paymentUrl });
    } catch (error) {
        console.error('[VNPay] Create payment error:', error);
        return res.status(500).json({ message: 'Failed to initiate VNPay payment' });
    }
}

export const vnpayReturn = async (req: Request, res: Response) => {
        console.log('[VNPay] Return callback triggered. Query:', req.query);

        try {
            const query = req.query as ReturnQueryFromVNPay;
            const verification = verifyVNPayReturn(query);

            const draftId = query.vnp_TxnRef as string;
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

            if (!verification.isSuccess) {
                console.log('[VNPay] Payment verification failed:', verification.message);

                // Restore stock by cancelling the draft
                if (draftId) {
                    try {
                        await cancelDraftOrder(draftId);
                        console.log('[VNPay] Draft cancelled after failed payment:', draftId);
                    } catch (cancelErr) {
                        console.error('[VNPay] Failed to cancel draft:', cancelErr);
                    }
                }

                return res.redirect(
                    `${frontendUrl}/checkout?error=payment_failed&vnp_ResponseCode=${query.vnp_ResponseCode ?? ''}`
                );
            }

            // Payment approved — finalize the order
            console.log('[VNPay] Payment verified. Finalizing draft:', draftId);
            const result = await finalizeDraftOrder(draftId);
            await updateOrderStatus(result.order._id.toString(), 'processing', 'paid');

            console.log('[VNPay] Order finalized:', result.order._id);
            return res.redirect(
                `${frontendUrl}/checkout/success?orderId=${result.order._id}`
            );
        } catch (error) {
            console.error('[VNPay] Return handler error:', error);
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            return res.redirect(`${frontendUrl}/checkout?error=payment_failed`);
        }
    };

export const vnpayIpn = async (req: Request, res: Response) => {
        console.log('[VNPay] IPN received. Query:', req.query);
        try {
            const query = req.query as ReturnQueryFromVNPay;
            const verification = verifyVNPayIpn(query);

            if (!verification.isSuccess) {
                console.log('[VNPay] IPN verification failed:', verification.message);
                return res.status(200).json({ RspCode: '97', Message: 'Invalid signature' });
            }

            const draftId = query.vnp_TxnRef as string;

            // Idempotency: attempt to finalise only if draft still exists
            const draft = await getDraft(draftId);
            if (!draft) {
                // Already processed (finalized or cancelled)
                return res.status(200).json({ RspCode: '02', Message: 'Order already confirmed' });
            }

            const result = await finalizeDraftOrder(draftId);
            await updateOrderStatus(result.order._id.toString(), 'processing', 'paid');

            console.log('[VNPay] IPN: Order finalized:', result.order._id);
            return res.status(200).json({ RspCode: '00', Message: 'Success' });
        } catch (error) {
            console.error('[VNPay] IPN handler error:', error);
            return res.status(200).json({ RspCode: '99', Message: 'Unknown error' });
        }
    };