import Order, { IOrder, OrderStatus, PaymentStatus } from '../models/Order';
import OrderItem from '../models/OrderItem';
import Product from '../models/Product';
import { restoreCouponCount } from './coupon.service';

export interface CreateOrderItemInput {
  productId: string;
  quantity: number;
  productSize?: string;
}

export interface CreateOrderInput {
  customerId?: string;
  items: CreateOrderItemInput[];
  shippingAddress: {
    fullName: string;
    email: string;
    phone: string;
    street: string;
    apartment?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  shippingMethod: 'standard' | 'express' | 'next_day';
  paymentMethod: 'credit_card' | 'paypal' | 'apple_pay' | 'google_pay' | 'cash_on_delivery' | 'vnpay';
  couponCode?: string;
  idempotencyKey?: string;
}

export const getOrderById = async (orderId: string, customerId?: string) => {
  const query: Record<string, unknown> = { _id: orderId };
  if (customerId) query.customerId = customerId;

  const order = await Order.findOne(query).lean();
  if (!order) return null;

  const items = await OrderItem.find({ orderId: order._id })
    .populate('productId', 'name img_url price')
    .lean();

  return { ...order, items };
};

export const getOrdersByCustomer = async (customerId: string) => {
  const orders = await Order.find({ customerId })
    .sort({ created_at: -1 })
    .lean();

  if (orders.length === 0) return [];

  const orderIds = orders.map((o) => o._id);
  const allItems = await OrderItem.find({ orderId: { $in: orderIds } })
    .populate('productId', 'name img_url price')
    .lean();

  const itemsByOrderId = new Map<string, typeof allItems>();
  for (const item of allItems) {
    const key = item.orderId.toString();
    if (!itemsByOrderId.has(key)) itemsByOrderId.set(key, []);
    itemsByOrderId.get(key)!.push(item);
  }

  return orders.map((order) => ({
    ...order,
    items: itemsByOrderId.get(order._id.toString()) ?? [],
  }));
};

export const getAllOrders = async (page = 1, limit = 20, status?: OrderStatus) => {
  const query: Record<string, unknown> = {};
  if (status) query.status = status;

  const skip = (page - 1) * limit;
  const [orders, total] = await Promise.all([
    Order.find(query)
      .populate('customerId', 'name email')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Order.countDocuments(query),
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

export const updateOrderStatus = async (
  orderId: string,
  status: OrderStatus,
  paymentStatus?: PaymentStatus,
) => {
  const update: Partial<IOrder> = { status };
  if (paymentStatus) update.payment_status = paymentStatus;

  const order = await Order.findByIdAndUpdate(orderId, update, { new: true });
  if (!order) throw new Error('Order not found');
  return order;
};

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
export const cancelOrder = async (orderId: string, customerId?: string) => {
  const query: Record<string, unknown> = { _id: orderId };
  if (customerId) query.customerId = customerId;

  const order = await Order.findOne(query);
  if (!order) throw new Error('Order not found');

  if (['shipped', 'delivered'].includes(order.status)) {
    throw new Error('Cannot cancel an order that has already been shipped or delivered');
  }

  if (order.status === 'cancelled') {
    throw new Error('Order is already cancelled');
  }

  // Restore per-size and aggregate stock — concurrent writes, not sequential.
  const items = await OrderItem.find({ orderId: order._id });
  await Promise.all(
    items.map((item) =>
      Product.updateOne(
        { _id: item.productId, 'sizes.size': item.productSize },
        { $inc: { 'sizes.$.stock': item.quantity, stock: item.quantity } },
      ),
    ),
  );

  // Restore coupon quota only if this order consumed one at finalization.
  if (order.coupon_code) {
    await restoreCouponCount(order.coupon_code);
  }

  order.status = 'cancelled';
  order.payment_status = 'refunded';
  await order.save();

  return order;
};