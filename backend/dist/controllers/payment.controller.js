"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.vnpayIpn = exports.vnpayReturn = exports.resumeVNPayPayment = exports.payWithVNPay = exports.payPalCancel = exports.payPalSuccess = exports.resumePayPalPayment = exports.payWithPayPal = exports.getMyPendingPayments = void 0;
const order_service_1 = require("../services/order.service");
const draftOrder_service_1 = require("../services/draftOrder.service");
const payment_service_1 = require("../services/payment.service");
const pendingPayment_service_1 = require("../services/pendingPayment.service");
const Product_1 = __importDefault(require("../models/Product"));
// ─── Helpers ───────────────────────────────────────────────────────────────────
const getBaseUrl = (req) => `${req.protocol}://${req.get('host')}`;
const getClientIp = (req) => {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
        const first = Array.isArray(forwarded) ? forwarded[0] : forwarded;
        return first.split(',')[0].trim();
    }
    return req.socket?.remoteAddress || req.ip || '127.0.0.1';
};
/** One DB query to get product names for all items in a draft. */
const buildProductNamesMap = async (productIds) => {
    const products = await Product_1.default.find({ _id: { $in: productIds } }).select('name').lean();
    return new Map(products.map((p) => [p._id.toString(), p.name]));
};
// ─── GET /api/payments/pending ─────────────────────────────────────────────────
const getMyPendingPayments = async (req, res) => {
    try {
        const userId = req.user?.sub;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const pending = await (0, pendingPayment_service_1.getPendingPaymentsForUser)(userId);
        return res.status(200).json(pending);
    }
    catch (error) {
        console.error('Get pending payments error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getMyPendingPayments = getMyPendingPayments;
// ─── PayPal ────────────────────────────────────────────────────────────────────
/**
 * POST /api/payments/paypal/create-order/:draftId
 * Initiates PayPal checkout and saves a PendingPayment record so the user
 * can resume if they close the browser.
 */
const payWithPayPal = async (req, res) => {
    console.log('[PayPal] Initiating payment for draft:', req.params.draftId);
    try {
        const { draftId } = req.params;
        const customerId = req.user?.sub;
        if (!customerId)
            return res.status(401).json({ message: 'Unauthorized' });
        const draft = await (0, draftOrder_service_1.getDraft)(draftId);
        if (!draft || draft.customerId !== customerId) {
            return res.status(404).json({ message: 'Draft not found' });
        }
        if (draft.paymentMethod !== 'paypal') {
            return res.status(400).json({ message: 'PayPal is not the selected payment method' });
        }
        const productNames = await buildProductNamesMap(draft.items.map((i) => i.productId));
        await (0, pendingPayment_service_1.createPendingPayment)(customerId, draft, productNames);
        const approvalUrl = await (0, payment_service_1.createPayPalPayment)(draft, getBaseUrl(req));
        return res.status(200).json({ approval_url: approvalUrl });
    }
    catch (error) {
        console.error('[PayPal] Create payment error:', error);
        return res.status(500).json({ message: 'Failed to initiate PayPal payment' });
    }
};
exports.payWithPayPal = payWithPayPal;
/**
 * POST /api/payments/paypal/resume/:draftId
 * Generates a fresh PayPal approval URL for an existing pending payment.
 * Used when the user returns after closing the browser.
 */
const resumePayPalPayment = async (req, res) => {
    try {
        const { draftId } = req.params;
        const customerId = req.user?.sub;
        if (!customerId)
            return res.status(401).json({ message: 'Unauthorized' });
        const pending = await (0, pendingPayment_service_1.getPendingPaymentByDraftId)(draftId, customerId);
        if (!pending)
            return res.status(404).json({ message: 'Pending payment not found' });
        if (pending.status !== 'awaiting_payment') {
            return res.status(400).json({ message: `Cannot resume a payment with status: ${pending.status}` });
        }
        const draft = await (0, draftOrder_service_1.getDraft)(draftId);
        if (!draft) {
            await (0, pendingPayment_service_1.cancelPendingPayment)(draftId);
            return res.status(410).json({ message: 'Payment session expired. Please start a new checkout.' });
        }
        const approvalUrl = await (0, payment_service_1.createPayPalPayment)(draft, getBaseUrl(req));
        return res.status(200).json({ approval_url: approvalUrl });
    }
    catch (error) {
        console.error('[PayPal] Resume error:', error);
        return res.status(500).json({ message: 'Failed to resume PayPal payment' });
    }
};
exports.resumePayPalPayment = resumePayPalPayment;
/**
 * GET /api/payments/paypal/success
 */
const payPalSuccess = async (req, res) => {
    console.log('[PayPal] Success callback. Query:', req.query);
    try {
        const { paymentId, PayerID, draftId } = req.query;
        if (!paymentId || !PayerID || !draftId) {
            return res.status(400).json({ message: 'Missing required PayPal parameters' });
        }
        const payment = await (0, payment_service_1.executePayPalPayment)(paymentId, PayerID);
        if (payment.state === 'approved') {
            const result = await (0, draftOrder_service_1.finalizeDraftOrder)(draftId);
            await (0, order_service_1.updateOrderStatus)(result.order._id.toString(), 'processing', 'paid');
            await (0, pendingPayment_service_1.completePendingPayment)(draftId, result.order._id.toString());
            const frontendUrl = 'http://localhost:5173';
            return res.redirect(`${frontendUrl}/checkout/success?orderId=${result.order._id}`);
        }
        return res.status(400).json({ message: 'Payment not approved' });
    }
    catch (error) {
        console.error('[PayPal] Success error:', error);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        return res.redirect(`${frontendUrl}/checkout?error=payment_failed`);
    }
};
exports.payPalSuccess = payPalSuccess;
/**
 * GET /api/payments/paypal/cancel
 * Restores stock by cancelling the draft.
 */
const payPalCancel = async (req, res) => {
    console.log('[PayPal] Cancel callback. Query:', req.query);
    try {
        const { draftId } = req.query;
        if (draftId) {
            try {
                await (0, draftOrder_service_1.cancelDraftOrder)(draftId);
                await (0, pendingPayment_service_1.cancelPendingPayment)(draftId);
                console.log(`[PayPal] Draft ${draftId} cancelled, stock restored`);
            }
            catch (err) {
                console.error(`[PayPal] Failed to cancel draft ${draftId}:`, err);
            }
        }
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        return res.redirect(`${frontendUrl}/checkout?error=payment_cancelled`);
    }
    catch (error) {
        console.error('[PayPal] Cancel error:', error);
        return res.status(500).json({ message: 'Error processing cancellation' });
    }
};
exports.payPalCancel = payPalCancel;
// ─── VNPay ─────────────────────────────────────────────────────────────────────
/**
 * POST /api/payments/vnpay/create-order/:draftId
 * Initiates VNPay checkout and saves a PendingPayment record.
 */
const payWithVNPay = async (req, res) => {
    console.log('[VNPay] Initiating payment for draft:', req.params.draftId);
    try {
        const { draftId } = req.params;
        const customerId = req.user?.sub;
        if (!customerId)
            return res.status(401).json({ message: 'Unauthorized' });
        const draft = await (0, draftOrder_service_1.getDraft)(draftId);
        if (!draft || draft.customerId !== customerId) {
            return res.status(404).json({ message: 'Draft not found' });
        }
        if (draft.paymentMethod !== 'vnpay') {
            return res.status(400).json({ message: 'VNPay is not the selected payment method' });
        }
        const productNames = await buildProductNamesMap(draft.items.map((i) => i.productId));
        await (0, pendingPayment_service_1.createPendingPayment)(customerId, draft, productNames);
        const paymentUrl = (0, payment_service_1.createVNPayPayment)(draft, getClientIp(req), getBaseUrl(req));
        return res.status(200).json({ payment_url: paymentUrl });
    }
    catch (error) {
        console.error('[VNPay] Create payment error:', error);
        return res.status(500).json({ message: 'Failed to initiate VNPay payment' });
    }
};
exports.payWithVNPay = payWithVNPay;
/**
 * POST /api/payments/vnpay/resume/:draftId
 * Generates a fresh VNPay payment URL for an existing pending payment.
 */
const resumeVNPayPayment = async (req, res) => {
    try {
        const { draftId } = req.params;
        const customerId = req.user?.sub;
        if (!customerId)
            return res.status(401).json({ message: 'Unauthorized' });
        const pending = await (0, pendingPayment_service_1.getPendingPaymentByDraftId)(draftId, customerId);
        if (!pending)
            return res.status(404).json({ message: 'Pending payment not found' });
        if (pending.status !== 'awaiting_payment') {
            return res.status(400).json({ message: `Cannot resume a payment with status: ${pending.status}` });
        }
        const draft = await (0, draftOrder_service_1.getDraft)(draftId);
        if (!draft) {
            await (0, pendingPayment_service_1.cancelPendingPayment)(draftId);
            return res.status(410).json({ message: 'Payment session expired. Please start a new checkout.' });
        }
        const paymentUrl = (0, payment_service_1.createVNPayPayment)(draft, getClientIp(req), getBaseUrl(req));
        return res.status(200).json({ payment_url: paymentUrl });
    }
    catch (error) {
        console.error('[VNPay] Resume error:', error);
        return res.status(500).json({ message: 'Failed to resume VNPay payment' });
    }
};
exports.resumeVNPayPayment = resumeVNPayPayment;
/**
 * GET /api/payments/vnpay/return
 */
const vnpayReturn = async (req, res) => {
    console.log('[VNPay] Return callback. Query:', req.query);
    try {
        const query = req.query;
        const verification = (0, payment_service_1.verifyVNPayReturn)(query);
        const draftId = query.vnp_TxnRef;
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        if (!verification.isSuccess) {
            console.log('[VNPay] Verification failed:', verification.message);
            if (draftId) {
                try {
                    await (0, draftOrder_service_1.cancelDraftOrder)(draftId);
                    await (0, pendingPayment_service_1.cancelPendingPayment)(draftId);
                }
                catch (err) {
                    console.error('[VNPay] Failed to cancel draft:', err);
                }
            }
            return res.redirect(`${frontendUrl}/checkout?error=payment_failed&vnp_ResponseCode=${query.vnp_ResponseCode ?? ''}`);
        }
        console.log('[VNPay] Payment verified. Finalizing draft:', draftId);
        const result = await (0, draftOrder_service_1.finalizeDraftOrder)(draftId);
        await (0, order_service_1.updateOrderStatus)(result.order._id.toString(), 'processing', 'paid');
        await (0, pendingPayment_service_1.completePendingPayment)(draftId, result.order._id.toString());
        return res.redirect(`${frontendUrl}/checkout/success?orderId=${result.order._id}`);
    }
    catch (error) {
        console.error('[VNPay] Return error:', error);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        return res.redirect(`${frontendUrl}/checkout?error=payment_failed`);
    }
};
exports.vnpayReturn = vnpayReturn;
/**
 * POST /api/payments/vnpay/ipn
 * Server-to-server notification — idempotent.
 */
const vnpayIpn = async (req, res) => {
    console.log('[VNPay] IPN received. Query:', req.query);
    try {
        const query = req.query;
        const verification = (0, payment_service_1.verifyVNPayIpn)(query);
        if (!verification.isSuccess) {
            return res.status(200).json({ RspCode: '97', Message: 'Invalid signature' });
        }
        const draftId = query.vnp_TxnRef;
        const draft = await (0, draftOrder_service_1.getDraft)(draftId);
        if (!draft) {
            return res.status(200).json({ RspCode: '02', Message: 'Order already confirmed' });
        }
        const result = await (0, draftOrder_service_1.finalizeDraftOrder)(draftId);
        await (0, order_service_1.updateOrderStatus)(result.order._id.toString(), 'processing', 'paid');
        await (0, pendingPayment_service_1.completePendingPayment)(draftId, result.order._id.toString());
        return res.status(200).json({ RspCode: '00', Message: 'Success' });
    }
    catch (error) {
        console.error('[VNPay] IPN error:', error);
        return res.status(200).json({ RspCode: '99', Message: 'Unknown error' });
    }
};
exports.vnpayIpn = vnpayIpn;
