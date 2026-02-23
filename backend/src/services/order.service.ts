import Order, { IOrder, OrderStatus, PaymentStatus } from '../models/Order';
import OrderItem from '../models/OrderItem';
import Product, { IProduct } from '../models/Product';
import { Types, Document } from 'mongoose';
import { sendOrderConfirmationEmail } from './email.service';

export interface CreateOrderItemInput {
  productId: string;
  quantity: number;
  productSize: string;
}

export interface OrderItemCreatePayload {
  orderId: Types.ObjectId;
  productId: Types.ObjectId;
  quantity: number;
  productSize: string;
  unit_price: number;
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

const SHIPPING_COSTS: Record<string, number> = {
  standard: 0,
  express: 9.99,
  next_day: 19.99,
};

const TAX_RATE = 0.08; // 8%

// Generate a human-readable order number like #PHT-UX3DUI
const generateOrderNumber = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const random = Array.from({ length: 6 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
  return `PHT-${random}`;
};

export const placeOrder = async (input: CreateOrderInput) => {
  const { customerId, items, shippingAddress, shippingMethod, paymentMethod, couponCode } = input;

  // 1. Validate all products exist and have sufficient stock
  const requestedProductIds = items.map((i) => new Types.ObjectId(i.productId));
  const uniqueProductIds = Array.from(new Set(requestedProductIds.map((id) => id.toString()))).map(
    (id) => new Types.ObjectId(id)
  );
  const products = await Product.find({ _id: { $in: uniqueProductIds } });

  if (products.length !== uniqueProductIds.length) {
    throw new Error('One or more products not found');
  }

  const productMap = new Map<string, IProduct & Document>(products.map((p) => [p._id.toString(), p]));

  // Check stock per size
  for (const item of items) {
    const product = productMap.get(item.productId);
    if (!product) throw new Error(`Product ${item.productId} not found`);

    const sizeEntry = product.sizes.find(
      (s) => s.size.toUpperCase() === item.productSize.toUpperCase()
    );
    if (!sizeEntry) {
      throw new Error(`Size ${item.productSize} not available for product "${product.name}"`);
    }
    if (sizeEntry.stock < item.quantity) {
      throw new Error(
        `Insufficient stock for "${product.name}" in size ${item.productSize}. Available: ${sizeEntry.stock}`
      );
    }
  }

  // 2. Calculate totals
  let subtotal = 0;
  for (const item of items) {
    const product = productMap.get(item.productId)!;
    subtotal += product.price * item.quantity;
  }

  const shippingCost = SHIPPING_COSTS[shippingMethod] ?? 0;
  const tax = parseFloat((subtotal * TAX_RATE).toFixed(2));
  const totalAmount = parseFloat((subtotal + shippingCost + tax).toFixed(2));

  // 3. Create order document
  const order = await Order.create({
    customerId: new Types.ObjectId(customerId),
    orderNumber: generateOrderNumber(),
    status: 'pending' as OrderStatus,
    payment_status: 'pending' as PaymentStatus,
    total_amount: totalAmount,
    subtotal,
    shipping_cost: shippingCost,
    tax,
    shipping_address: shippingAddress,
    shipping_method: shippingMethod,
    payment_method: paymentMethod,
    coupon_code: couponCode,
  });

  // 4. Create order items
  //const orderItemDocs: Array<Omit<IOrderItem, keyof Document>> = items.map(...);
  //const orderItems = await OrderItem.insertMany(orderItemDocs as any);
  const orderItemDocs: OrderItemCreatePayload[] = items.map((item) => {
    const product = productMap.get(item.productId) as IProduct & Document;
    return {
      orderId: order._id as Types.ObjectId,
      productId: new Types.ObjectId(item.productId),
      quantity: item.quantity,
      productSize: item.productSize.toUpperCase(),
      unit_price: product.price,
    };
  });
  const orderItems = await OrderItem.insertMany(orderItemDocs as any);

  // 5. Deduct stock from product sizes
  for (const item of items) {
    await Product.updateOne(
      { _id: item.productId, 'sizes.size': item.productSize.toUpperCase() },
      { $inc: { 'sizes.$.stock': -item.quantity, stock: -item.quantity } }
    );
  }

  const emailItems = items.map((item) => {
    const product = productMap.get(item.productId);
    return {
      name: product?.name ?? `Product ${item.productId}`,
      quantity: item.quantity,
      unit_price: product?.price ?? 0,
      productSize: item.productSize,
    };
  });

  try {
    await sendOrderConfirmationEmail({
      to: shippingAddress.email,
      customerName: shippingAddress.fullName,
      orderNumber: order.orderNumber,
      shippingMethod,
      paymentMethod,
      subtotal,
      shippingCost,
      tax,
      totalAmount,
      couponCode,
      shippingAddress,
      items: emailItems,
    });
  } catch (error) {
    console.error('Order confirmation email failed:', error);
  }

  return { order, orderItems };
};

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
  const orders = await Order.find({ customerId })
    .sort({ created_at: -1 })
    .lean();

  // Attach items to each order
  const ordersWithItems = await Promise.all(
    orders.map(async (order) => {
      const items = await OrderItem.find({ orderId: order._id })
        .populate('productId', 'name img_url price')
        .lean();
      return { ...order, items };
    })
  );

  return ordersWithItems;
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

  // Restore stock
  const items = await OrderItem.find({ orderId: order._id });
  for (const item of items) {
    await Product.updateOne(
      { _id: item.productId, 'sizes.size': item.productSize },
      { $inc: { 'sizes.$.stock': item.quantity, stock: item.quantity } }
    );
  }

  order.status = 'cancelled';
  order.payment_status = 'refunded';
  await order.save();

  return order;
};