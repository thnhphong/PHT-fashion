"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelOrder = exports.updateOrderStatus = exports.getAllOrders = exports.getOrdersByCustomer = exports.getOrderById = void 0;
const Order_1 = __importDefault(require("../models/Order"));
const OrderItem_1 = __importDefault(require("../models/OrderItem"));
const Product_1 = __importDefault(require("../models/Product"));
const coupon_service_1 = require("./coupon.service");
const getOrderById = async (orderId, customerId) => {
    const query = { _id: orderId };
    if (customerId)
        query.customerId = customerId;
    const order = await Order_1.default.findOne(query).lean();
    if (!order)
        return null;
    const items = await OrderItem_1.default.find({ orderId: order._id })
        .populate('productId', 'name img_url price')
        .lean();
    return { ...order, items };
};
exports.getOrderById = getOrderById;
const getOrdersByCustomer = async (customerId) => {
    const orders = await Order_1.default.find({ customerId })
        .sort({ created_at: -1 })
        .lean();
    if (orders.length === 0)
        return [];
    const orderIds = orders.map((o) => o._id);
    const allItems = await OrderItem_1.default.find({ orderId: { $in: orderIds } })
        .populate('productId', 'name img_url price')
        .lean();
    const itemsByOrderId = new Map();
    for (const item of allItems) {
        const key = item.orderId.toString();
        if (!itemsByOrderId.has(key))
            itemsByOrderId.set(key, []);
        itemsByOrderId.get(key).push(item);
    }
    return orders.map((order) => ({
        ...order,
        items: itemsByOrderId.get(order._id.toString()) ?? [],
    }));
};
exports.getOrdersByCustomer = getOrdersByCustomer;
const getAllOrders = async (page = 1, limit = 20, status) => {
    const query = {};
    if (status)
        query.status = status;
    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
        Order_1.default.find(query)
            .populate('customerId', 'name email')
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        Order_1.default.countDocuments(query),
    ]);
    return {
        data: orders,
        pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalItems: total,
            itemsPerPage: limit,
            hasNextPage: page < Math.ceil(total / limit),
            hasPrevPage: page > 1,
        },
    };
};
exports.getAllOrders = getAllOrders;
const updateOrderStatus = async (orderId, status, paymentStatus) => {
    const update = { status };
    if (paymentStatus)
        update.payment_status = paymentStatus;
    const order = await Order_1.default.findByIdAndUpdate(orderId, update, { new: true });
    if (!order)
        throw new Error('Order not found');
    return order;
};
exports.updateOrderStatus = updateOrderStatus;
/**
 * Cancels an order and restores inventory + coupon quota.
 *
 * COUPON RESTORE:
 *   If the order was placed with a coupon (`coupon_code` field is set), we
 *   increment the coupon's count by 1 so the freed slot can be used again.
 *   This mirrors the `validateAndConsumeCoupon` decrement that happened at
 *   finalization time.
 *
 *   Note: We do NOT restore the coupon if the order was cancelled at the
 *   *draft* stage — the count was never decremented for drafts, only for
 *   finalized orders.
 */
const cancelOrder = async (orderId, customerId) => {
    const query = { _id: orderId };
    if (customerId)
        query.customerId = customerId;
    const order = await Order_1.default.findOne(query);
    if (!order)
        throw new Error('Order not found');
    if (['shipped', 'delivered'].includes(order.status)) {
        throw new Error('Cannot cancel an order that has already been shipped or delivered');
    }
    if (order.status === 'cancelled') {
        throw new Error('Order is already cancelled');
    }
    // Restore per-size and aggregate stock — concurrent writes, not sequential.
    const items = await OrderItem_1.default.find({ orderId: order._id });
    await Promise.all(items.map((item) => Product_1.default.updateOne({ _id: item.productId, 'sizes.size': item.productSize }, { $inc: { 'sizes.$.stock': item.quantity, stock: item.quantity } })));
    // Restore coupon quota only if this order consumed one at finalization.
    if (order.coupon_code) {
        await (0, coupon_service_1.restoreCouponCount)(order.coupon_code);
    }
    order.status = 'cancelled';
    order.payment_status = 'refunded';
    await order.save();
    return order;
};
exports.cancelOrder = cancelOrder;
