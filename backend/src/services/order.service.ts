import Order, { IOrder, OrderStatus, PaymentStatus } from '../models/Order';
import OrderItem from '../models/OrderItem';
import Product from '../models/Product';


export interface CreateOrderItemInput {
  productId: string;
  quantity: number;
  productSize?: string;
}

export interface CreateOrderInput {
  customerId: string;
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
  paymentMethod: 'credit_card' | 'paypal' | 'apple_pay' | 'google_pay' | 'cash_on_delivery';
  couponCode?: string;
}

export const getOrderById = async (orderId: string, customerId?: string) => {
  const query: any = { _id: orderId };
  if (customerId) query.customerId = customerId; // scoped to user if not admin

  const order = await Order.findOne(query).lean();
  if (!order) return null;

  const items = await OrderItem.find({ orderId: order._id })
    .populate('productId', 'name img_url price')
    .lean();

  return { ...order, items };
};

export const getOrdersByCustomer = async (customerId: string) => {
  // Query 1: fetch all orders for this customer
  const orders = await Order.find({ customerId })
    .sort({ created_at: -1 })
    .lean();

  if (orders.length === 0) return [];

  // Query 2: fetch ALL items for ALL orders in one $in query — eliminates N+1
  const orderIds = orders.map((o) => o._id);
  const allItems = await OrderItem.find({ orderId: { $in: orderIds } })
    .populate('productId', 'name img_url price')
    .lean();

  // Group items by orderId in memory — O(n), zero extra queries
  const itemsByOrderId = new Map<string, typeof allItems>();
  for (const item of allItems) {
    const key = item.orderId.toString();
    if (!itemsByOrderId.has(key)) itemsByOrderId.set(key, []);
    itemsByOrderId.get(key)!.push(item);
  }

  // Attach items to each order
  return orders.map((order) => ({
    ...order,
    items: itemsByOrderId.get(order._id.toString()) ?? [],
  }));
};

export const getAllOrders = async (page = 1, limit = 20, status?: OrderStatus) => {
  const query: any = {};
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
  paymentStatus?: PaymentStatus
) => {
  const update: Partial<IOrder> = { status };
  if (paymentStatus) update.payment_status = paymentStatus;

  const order = await Order.findByIdAndUpdate(orderId, update, { new: true });
  if (!order) throw new Error('Order not found');
  return order;
};

export const cancelOrder = async (orderId: string, customerId?: string) => {
  const query: any = { _id: orderId };
  if (customerId) query.customerId = customerId;

  const order = await Order.findOne(query);
  if (!order) throw new Error('Order not found');

  if (['shipped', 'delivered'].includes(order.status)) {
    throw new Error('Cannot cancel an order that has already been shipped or delivered');
  }

  if (order.status === 'cancelled') {
    throw new Error('Order is already cancelled');
  }

  // Restore stock — concurrent writes, not sequential
  const items = await OrderItem.find({ orderId: order._id });
  await Promise.all(
    items.map((item) =>
      Product.updateOne(
        { _id: item.productId, 'sizes.size': item.productSize },
        { $inc: { 'sizes.$.stock': item.quantity, stock: item.quantity } }
      )
    )
  );

  order.status = 'cancelled';
  order.payment_status = 'refunded';
  await order.save();

  return order;
};