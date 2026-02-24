import Order, { IOrder, OrderStatus, PaymentStatus } from '../models/Order';
import OrderItem, { IOrderItem } from '../models/OrderItem';
import Product, { IProduct } from '../models/Product';
import { Types, Document } from 'mongoose';
import mongoose from 'mongoose';


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
  paymentMethod: 'credit_card' | 'paypal' | 'apple_pay' | 'google_pay';
  couponCode?: string;
}

export interface OrderItemCreatePayload {
  orderId: Types.ObjectId;
  productId: Types.ObjectId;
  quantity: number;
  productSize: string;
  unit_price: number;
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

const DEFAULT_SIZE_LABEL = 'ONE_SIZE';
const normalizeSize = (size?: string) => (size ? size.trim().toUpperCase() : undefined);

export const placeOrder = async (input: CreateOrderInput) => {
  const session = await mongoose.startSession();
  try {
    const result = await session.withTransaction(async () => {
      const { customerId, items, shippingAddress, shippingMethod, paymentMethod, couponCode } =
        input;

      const normalizedItems = items.map((item) => ({
        ...item,
        productSize: normalizeSize(item.productSize),
      }));

      const uniqueProductIds = [...new Set(normalizedItems.map((i) => i.productId))].map(
        (id) => new Types.ObjectId(id)
      );
      const products = await Product.find({ _id: { $in: uniqueProductIds } }, null, { session });

      if (products.length !== uniqueProductIds.length) {
        throw new Error('One or more products not found');
      }

      const productMap = new Map<string, IProduct & Document>(
        products.map((p) => [p._id.toString(), p])
      );

      const stockUpdates = await Promise.all(
        normalizedItems.map((item) => {
          const product = productMap.get(item.productId);
          const hasSizeMatch =
            Boolean(item.productSize) &&
            product?.sizes?.some((size) => size.size === item.productSize);

          const filter = hasSizeMatch
            ? {
                _id: item.productId,
                sizes: {
                  $elemMatch: {
                    size: item.productSize,
                    stock: { $gte: item.quantity },
                  },
                },
              }
            : {
                _id: item.productId,
                stock: { $gte: item.quantity },
              };

          const update = hasSizeMatch
            ? { $inc: { 'sizes.$.stock': -item.quantity, stock: -item.quantity } }
            : { $inc: { stock: -item.quantity } };

          return Product.findOneAndUpdate(filter, update, {
            new: true,
            session,
          });
        })
      );

      stockUpdates.forEach((result, index) => {
        if (!result) {
          const item = normalizedItems[index];
          const product = productMap.get(item.productId);
          const sizeLabel = item.productSize ? ` in size ${item.productSize}` : '';
          throw new Error(
            `Insufficient stock for "${product?.name ?? item.productId}"${sizeLabel}`
          );
        }
      });

      let subtotal = 0;
      for (const item of normalizedItems) {
        subtotal += productMap.get(item.productId)!.price * item.quantity;
      }
      const shippingCost = SHIPPING_COSTS[shippingMethod] ?? 0;
      const tax = parseFloat((subtotal * TAX_RATE).toFixed(2));
      const totalAmount = parseFloat((subtotal + shippingCost + tax).toFixed(2));

      const [order] = await Order.create(
        [
          {
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
          },
        ],
        { session }
      );

      const orderItemDocs: OrderItemCreatePayload[] = normalizedItems.map((item) => ({
        orderId: order._id as Types.ObjectId,
        productId: new Types.ObjectId(item.productId),
        quantity: item.quantity,
        productSize: item.productSize ?? DEFAULT_SIZE_LABEL,
        unit_price: productMap.get(item.productId)!.price,
      }));
      const orderItems = (await OrderItem.insertMany(orderItemDocs, { session })) as IOrderItem[];

      return { order, orderItems };
    });

    if (!result) {
      throw new Error('Failed to place order');
    }

    return result;
  } finally {
    session.endSession();
  }
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