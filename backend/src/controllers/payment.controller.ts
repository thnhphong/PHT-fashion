import { Request, Response } from 'express';
import { getOrderById, updateOrderStatus, cancelOrder } from '../services/order.service';
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
    console.log('[DEBUG - PayPal] Order ID:', req.params.orderId);

    try {
        const { orderId } = req.params;
        const customerId = req.user?.sub; // assuming authenticated

        if (!customerId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const order = await getOrderById(orderId as string, customerId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        console.log('[DEBUG - PayPal] Order fetched successfully:', orderId);

        if (order.status !== 'pending' && order.payment_status !== 'pending') {
            console.warn('[DEBUG - PayPal] Order is not pending. Status:', order.status);
            return res.status(400).json({ message: 'Order cannot be paid at this time' });
        }

        console.log('[DEBUG - PayPal] Calling createPayPalPayment service...');
        const approvalUrl = await createPayPalPayment(order as any, getBaseUrl(req));

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
        const { paymentId, PayerID, orderId } = req.query;

        if (!paymentId || !PayerID || !orderId) {
            console.log('[DEBUG - PayPal] Missing required parameters. Aborting.');
            return res.status(400).json({ message: 'Missing required PayPal parameters' });
        }

        console.log('[DEBUG - PayPal] Executing payment...');
        // Execute the payment
        const payment = await executePayPalPayment(paymentId as string, PayerID as string);

        console.log('[DEBUG - PayPal] Payment executed. State:', payment.state);

        if (payment.state === 'approved') {
            console.log('[DEBUG - PayPal] Updating order status in DB to processing/paid...');
            // Update order status
            await updateOrderStatus(orderId as string, 'processing', 'paid');

            // Redirect to frontend success page
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            return res.redirect(`${frontendUrl}/checkout/success?orderId=${orderId}`);
        } else {
            return res.status(400).json({ message: 'Payment not approved' });
        }
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
        const { orderId } = req.query;
        if (orderId) {
            console.log(`[DEBUG - PayPal] Cancelling order ${orderId} due to payment cancellation`);
            try {
                // Cancel order to trigger restock logic
                await cancelOrder(orderId as string);
                console.log(`[DEBUG - PayPal] Order ${orderId} cancelled successfully`);
            } catch (cancelError) {
                console.error(`[DEBUG - PayPal] Failed to cancel order ${orderId}:`, cancelError);
            }
        }

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        return res.redirect(`${frontendUrl}/checkout?error=payment_cancelled`);
    } catch (error) {
        console.error('PayPal cancel error:', error);
        return res.status(500).json({ message: 'Error processing cancellation' });
    }
};
