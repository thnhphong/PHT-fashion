
import { randomUUID } from 'crypto';
import { Types } from 'mongoose';
import mongoose from 'mongoose';
import Order, { OrderStatus, PaymentStatus } from '../models/Order';
import OrderItem, { IOrderItem } from '../models/OrderItem';
import Product, { IProduct } from '../models/Product';
import { connectRedis, getRedisClient } from '../utils/redis.util';
import { CreateOrderInput, CreateOrderItemInput } from './order.service';
import {
  DEFAULT_SIZE_LABEL,
  generateOrderNumber,
  normalizeSize,
  SHIPPING_COSTS,
  TAX_RATE,
} from './order.constants';

const DRAFT_KEY_PREFIX = 'draft_order:';
const DEFAULT_TTL_SECONDS = 15 * 60;

const getDraftKey = (draftId: string) => `${DRAFT_KEY_PREFIX}${draftId}`;

const parseDraftTtl = () => {
  const configured = Number(process.env.DRAFT_ORDER_TTL_SECONDS);
  if (Number.isFinite(configured) && configured > 0) {
    return Math.max(60, Math.floor(configured));
  }
  return DEFAULT_TTL_SECONDS;
};

const ensureRedisClient = async () => {
  await connectRedis();
  return getRedisClient();
};

export interface DraftedItem {
  productId: string;
  productSize?: string;
  quantity: number;
  unit_price: number;
}

export interface DraftOrderData {
  draftId: string;
  customerId: string;
  shippingAddress: CreateOrderInput['shippingAddress'];
  shippingMethod: CreateOrderInput['shippingMethod'];
  paymentMethod: CreateOrderInput['paymentMethod'];
  couponCode?: string;
  items: DraftedItem[];
  totals: {
    subtotal: number;
    shippingCost: number;
    tax: number;
    totalAmount: number;
  };
  createdAt: number;
  expiresAt: number;
}

interface ReservedStockResult {
  normalizedItems: CreateOrderItemInput[];
  productMap: Map<string, IProduct>;
}

export const reserveStockForItems = async (items: CreateOrderItemInput[]): Promise<ReservedStockResult> => {
  if (items.length === 0) {
    throw new Error('Must reserve stock for at least one item');
  }

  const normalizedItems = items.map((item) => ({
    ...item,
    productSize: normalizeSize(item.productSize),
  }));

  const uniqueProductIds = [
    ...new Set(normalizedItems.map((item) => item.productId)),
  ];

  const products = await Product.find({ _id: { $in: uniqueProductIds } });
  if (products.length !== uniqueProductIds.length) {
    throw new Error('One or more products not found');
  }

  const productMap = new Map(products.map((product) => [product._id.toString(), product]));

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

  return { normalizedItems, productMap };
};

export const restoreStockForItems = async (items: DraftedItem[]) => {
  if (items.length === 0) return;

  await Promise.all(
    items.map((item) => {
      const hasSizeMatch = Boolean(item.productSize);
      const filter = hasSizeMatch
        ? { _id: item.productId, 'sizes.size': item.productSize }
        : { _id: item.productId };
      const update = hasSizeMatch
        ? { $inc: { 'sizes.$.stock': item.quantity, stock: item.quantity } }
        : { $inc: { stock: item.quantity } };
      return Product.findOneAndUpdate(filter, update);
    })
  );
};

export const createDraftOrder = async (payload: CreateOrderInput) => {
  const { normalizedItems, productMap } = await reserveStockForItems(payload.items);
  const draftItems: DraftedItem[] = normalizedItems.map((item) => {
    const product = productMap.get(item.productId);
    if (!product) {
      throw new Error(`Product ${item.productId} is missing from the reservation map`);
    }
    return {
      productId: item.productId,
      productSize: item.productSize,
      quantity: item.quantity,
      unit_price: product.price,
    };
  });

  const subtotal = draftItems.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  const shippingCost = SHIPPING_COSTS[payload.shippingMethod] ?? 0;
  const tax = parseFloat((subtotal * TAX_RATE).toFixed(2));
  const totalAmount = parseFloat((subtotal + shippingCost + tax).toFixed(2));
  const draftId = randomUUID();
  const ttlSeconds = parseDraftTtl();
  const now = Date.now();
  const expiresAt = now + ttlSeconds * 1000;

  const draft: DraftOrderData = {
    draftId,
    customerId: payload.customerId,
    shippingAddress: payload.shippingAddress,
    shippingMethod: payload.shippingMethod,
    paymentMethod: payload.paymentMethod,
    couponCode: payload.couponCode,
    items: draftItems,
    totals: {
      subtotal,
      shippingCost,
      tax,
      totalAmount,
    },
    createdAt: now,
    expiresAt,
  };

  const client = await ensureRedisClient();
  await client.set(getDraftKey(draftId), JSON.stringify(draft), { EX: ttlSeconds });

  return {
    draftId,
    expiresAt,
    totals: draft.totals,
  };
};

export const getDraft = async (draftId: string): Promise<DraftOrderData | null> => {
  const client = await ensureRedisClient();
  const payload = await client.get(getDraftKey(draftId));
  if (!payload) return null;
  try {
    return JSON.parse(payload) as DraftOrderData;
  } catch (error) {
    throw new Error('Stored draft payload is invalid');
  }
};

const deleteDraft = async (draftId: string) => {
  const client = await ensureRedisClient();
  await client.del(getDraftKey(draftId));
};

export const finalizeDraftOrder = async (draftId: string) => {
  const draft = await getDraft(draftId);
  if (!draft) {
    throw new Error('Draft order not found or already finalized');
  }

  const result = await createOrderFromDraft(draft);
  await deleteDraft(draftId);
  return result;
};

export const createOrderFromDraft = async (draft: DraftOrderData) => {
  const session = await mongoose.startSession();
  try {
    const result = await session.withTransaction(async () => {
      const [order] = await Order.create(
        [
          {
            customerId: new Types.ObjectId(draft.customerId),
            orderNumber: generateOrderNumber(),
            status: 'pending' as OrderStatus,
            payment_status: 'pending' as PaymentStatus,
            total_amount: draft.totals.totalAmount,
            subtotal: draft.totals.subtotal,
            shipping_cost: draft.totals.shippingCost,
            tax: draft.totals.tax,
            shipping_address: draft.shippingAddress,
            shipping_method: draft.shippingMethod,
            payment_method: draft.paymentMethod,
            coupon_code: draft.couponCode,
          },
        ],
        { session }
      );

      const orderItemsPayload = draft.items.map((item) => ({
        orderId: order._id as Types.ObjectId,
        productId: new Types.ObjectId(item.productId),
        quantity: item.quantity,
        productSize: item.productSize ?? DEFAULT_SIZE_LABEL,
        unit_price: item.unit_price,
      }));

      const orderItems = (await OrderItem.insertMany(orderItemsPayload, { session })) as IOrderItem[];
      return { order, orderItems };
    });

    if (!result) {
      throw new Error('Failed to finalize draft order');
    }

    return result;
  } finally {
    session.endSession();
  }
};

export const cancelDraftOrder = async (draftId: string): Promise<DraftOrderData | null> => {
  const draft = await getDraft(draftId);
  if (!draft) return null;
  await restoreStockForItems(draft.items);
  await deleteDraft(draftId);
  return draft;
};

type RedisScanKey = string | Buffer;
type RedisScanBatch = RedisScanKey | RedisScanKey[];

export const cleanupExpiredDrafts = async () => {
  const client = await ensureRedisClient();
  const iterator = client.scanIterator({ MATCH: `${DRAFT_KEY_PREFIX}*`, COUNT: 100 }) as AsyncIterable<
    RedisScanBatch
  >;
  let cancelledCount = 0;

  for await (const batch of iterator) {
    const keys = Array.isArray(batch) ? batch : [batch];
    for (const rawKey of keys) {
      const key = typeof rawKey === 'string' ? rawKey : rawKey.toString();
      try {
        const payload = await client.get(key);
        if (!payload) continue;
        const draft = JSON.parse(payload) as DraftOrderData;
        if (Date.now() >= draft.expiresAt) {
          const cancelled = await cancelDraftOrder(draft.draftId);
          if (cancelled) {
            cancelledCount += 1;
          }
        }
      } catch (error) {
        console.error(`Failed to inspect draft key "${key}"`, error);
      }
    }
  }

  return cancelledCount;
};

