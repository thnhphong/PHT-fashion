import { Request, Response } from 'express';
import { updateOrderStatus } from '../services/order.service';
import {
  cancelDraftOrder,
  finalizeDraftOrder,
  getDraft,
} from '../services/draftOrder.service';
import { createPayPalPayment, executePayPalPayment } from '../services/payment.service';

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
