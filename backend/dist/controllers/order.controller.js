"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminCancelOrder = exports.adminUpdateOrderStatus = exports.adminGetOrder = exports.adminGetAllOrders = exports.cancelMyOrder = exports.getOrder = exports.getMyOrders = exports.cancelOrderDraft = exports.cancelGuestOrderDraft = exports.finalizeOrderDraft = exports.finalizeGuestOrderDraft = exports.createGuestOrder = exports.createOrder = void 0;
const order_service_1 = require("../services/order.service");
const draftOrder_service_1 = require("../services/draftOrder.service");
const SHIPPING_ADDRESS_REQUIRED_FIELDS = [
    ['fullName', 'Full name'],
    ['email', 'Email'],
    ['phone', 'Phone number'],
    ['street', 'Street address'],
    ['city', 'City'],
    ['state', 'State/Province'],
    ['zipCode', 'ZIP/postal code'],
    ['country', 'Country'],
];
const ensureShippingAddressComplete = (address) => {
    for (const [field, label] of SHIPPING_ADDRESS_REQUIRED_FIELDS) {
        const value = address[field] ?? '';
        if (!value.trim()) {
            throw new Error(`${label} is required`);
        }
    }
};
// POST /api/orders  — authenticated customer
const createOrder = async (req, res) => {
    try {
        const customerId = req.user?.sub;
        if (!customerId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const { items, shippingAddress, shippingMethod, paymentMethod, couponCode, idempotencyKey } = req.body;
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: 'Order must contain at least one item' });
        }
        if (!shippingAddress) {
            return res.status(400).json({ message: 'Shipping address is required' });
        }
        ensureShippingAddressComplete(shippingAddress);
        const draft = await (0, draftOrder_service_1.createDraftOrder)({
            customerId,
            items,
            shippingAddress,
            shippingMethod,
            paymentMethod,
            couponCode,
            idempotencyKey,
        });
        return res.status(201).json({
            message: 'Order draft created',
            draftId: draft.draftId,
            expiresAt: draft.expiresAt,
            totals: draft.totals,
        });
    }
    catch (error) {
        if (error instanceof Error) {
            // Business logic errors (stock, not found, etc.)
            return res.status(400).json({ message: error.message });
        }
        console.error('Create order error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.createOrder = createOrder;
const createGuestOrder = async (req, res) => {
    try {
        const { items, shippingAddress, shippingMethod, paymentMethod, couponCode, idempotencyKey } = req.body;
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: 'Order must contain at least one item' });
        }
        if (!shippingAddress) {
            return res.status(400).json({ message: 'Shipping address is required' });
        }
        ensureShippingAddressComplete(shippingAddress);
        const draft = await (0, draftOrder_service_1.createDraftOrder)({
            items,
            shippingAddress,
            shippingMethod,
            paymentMethod,
            couponCode,
            idempotencyKey,
        });
        return res.status(201).json({
            message: 'Guest order draft created',
            draftId: draft.draftId,
            expiresAt: draft.expiresAt,
            totals: draft.totals,
        });
    }
    catch (error) {
        if (error instanceof Error) {
            return res.status(400).json({ message: error.message });
        }
        console.error('Create guest order error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.createGuestOrder = createGuestOrder;
const finalizeGuestOrderDraft = async (req, res) => {
    try {
        const { draftId } = req.params;
        const draft = await (0, draftOrder_service_1.getDraft)(draftId);
        if (!draft) {
            return res.status(404).json({ message: 'Draft not found' });
        }
        if (draft.customerId) {
            return res.status(401).json({ message: 'Must be logged in to finalize this draft' });
        }
        const result = await (0, draftOrder_service_1.finalizeDraftOrder)(draftId);
        return res.status(201).json({
            message: 'Guest order finalized',
            order: result.order,
            items: result.orderItems,
        });
    }
    catch (error) {
        if (error instanceof Error) {
            return res.status(400).json({ message: error.message });
        }
        console.error('Finalize guest draft error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.finalizeGuestOrderDraft = finalizeGuestOrderDraft;
const finalizeOrderDraft = async (req, res) => {
    try {
        const customerId = req.user?.sub;
        if (!customerId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const { draftId } = req.params;
        const draft = await (0, draftOrder_service_1.getDraft)(draftId);
        if (!draft || draft.customerId !== customerId) {
            return res.status(404).json({ message: 'Draft not found' });
        }
        const result = await (0, draftOrder_service_1.finalizeDraftOrder)(draftId);
        return res.status(201).json({
            message: 'Order finalized',
            order: result.order,
            items: result.orderItems,
        });
    }
    catch (error) {
        if (error instanceof Error) {
            return res.status(400).json({ message: error.message });
        }
        console.error('Finalize draft error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.finalizeOrderDraft = finalizeOrderDraft;
const cancelGuestOrderDraft = async (req, res) => {
    try {
        const { draftId } = req.params;
        const draft = await (0, draftOrder_service_1.getDraft)(draftId);
        if (!draft) {
            return res.status(404).json({ message: 'Draft not found' });
        }
        if (draft.customerId) {
            return res.status(401).json({ message: 'Cannot cancel an authenticated draft from this endpoint' });
        }
        await (0, draftOrder_service_1.cancelDraftOrder)(draftId);
        return res.status(200).json({ message: 'Guest draft cancelled successfully' });
    }
    catch (error) {
        if (error instanceof Error) {
            return res.status(400).json({ message: error.message });
        }
        console.error('Cancel guest draft error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.cancelGuestOrderDraft = cancelGuestOrderDraft;
const cancelOrderDraft = async (req, res) => {
    try {
        const customerId = req.user?.sub;
        if (!customerId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const { draftId } = req.params;
        const draft = await (0, draftOrder_service_1.getDraft)(draftId);
        if (!draft || draft.customerId !== customerId) {
            return res.status(404).json({ message: 'Draft not found' });
        }
        await (0, draftOrder_service_1.cancelDraftOrder)(draftId);
        return res.status(200).json({ message: 'Draft cancelled successfully' });
    }
    catch (error) {
        if (error instanceof Error) {
            return res.status(400).json({ message: error.message });
        }
        console.error('Cancel draft error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.cancelOrderDraft = cancelOrderDraft;
// GET /api/orders/my  — authenticated customer — own orders
const getMyOrders = async (req, res) => {
    try {
        const customerId = req.user?.sub;
        if (!customerId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const orders = await (0, order_service_1.getOrdersByCustomer)(customerId);
        return res.status(200).json(orders);
    }
    catch (error) {
        console.error('Get my orders error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getMyOrders = getMyOrders;
// GET /api/orders/:id  — authenticated customer (own order) or admin
const getOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const customerId = req.user?.role === 'admin' ? undefined : req.user?.sub;
        const order = await (0, order_service_1.getOrderById)(id, customerId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        return res.status(200).json(order);
    }
    catch (error) {
        console.error('Get order error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getOrder = getOrder;
// POST /api/orders/:id/cancel  — authenticated customer (own order)
const cancelMyOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const customerId = req.user?.sub;
        if (!customerId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const order = await (0, order_service_1.cancelOrder)(id, customerId);
        return res.status(200).json({ message: 'Order cancelled successfully', order });
    }
    catch (error) {
        if (error instanceof Error) {
            return res.status(400).json({ message: error.message });
        }
        console.error('Cancel order error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.cancelMyOrder = cancelMyOrder;
// ─── Admin-only below ────────────────────────────────────────────────────────
// GET /api/admin/orders
const adminGetAllOrders = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        const status = req.query.status;
        const result = await (0, order_service_1.getAllOrders)(page, limit, status);
        return res.status(200).json(result);
    }
    catch (error) {
        console.error('Admin get orders error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.adminGetAllOrders = adminGetAllOrders;
// GET /api/admin/orders/:id
const adminGetOrder = async (req, res) => {
    try {
        const order = await (0, order_service_1.getOrderById)(req.params.id); // no customerId filter for admin
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        return res.status(200).json(order);
    }
    catch (error) {
        console.error('Admin get order error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.adminGetOrder = adminGetOrder;
// PATCH /api/admin/orders/:id/status
const adminUpdateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, paymentStatus } = req.body;
        const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
        }
        const order = await (0, order_service_1.updateOrderStatus)(id, status, paymentStatus);
        return res.status(200).json({ message: 'Order status updated', order });
    }
    catch (error) {
        if (error instanceof Error && error.message === 'Order not found') {
            return res.status(404).json({ message: 'Order not found' });
        }
        console.error('Admin update status error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.adminUpdateOrderStatus = adminUpdateOrderStatus;
// POST /api/admin/orders/:id/cancel
const adminCancelOrder = async (req, res) => {
    try {
        const order = await (0, order_service_1.cancelOrder)(req.params.id); // no customerId restriction for admin
        return res.status(200).json({ message: 'Order cancelled successfully', order });
    }
    catch (error) {
        if (error instanceof Error) {
            return res.status(400).json({ message: error.message });
        }
        console.error('Admin cancel order error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.adminCancelOrder = adminCancelOrder;
