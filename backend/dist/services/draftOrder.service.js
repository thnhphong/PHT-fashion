"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupExpiredDrafts = exports.cancelDraftOrder = exports.createOrderFromDraft = exports.finalizeDraftOrder = exports.getDraft = exports.createDraftOrder = exports.restoreStockForItems = exports.reserveStockForItems = void 0;
const crypto_1 = require("crypto");
const mongoose_1 = require("mongoose");
const mongoose_2 = __importDefault(require("mongoose"));
const Order_1 = __importDefault(require("../models/Order"));
const OrderItem_1 = __importDefault(require("../models/OrderItem"));
const Product_1 = __importDefault(require("../models/Product"));
const redis_util_1 = require("../utils/redis.util");
const order_constants_1 = require("./order.constants");
const coupon_service_1 = require("./coupon.service");
// ─── Redis key helpers ────────────────────────────────────────────────────────
const DRAFT_KEY_PREFIX = 'draft_order:';
const DEFAULT_TTL_SECONDS = 15 * 60;
const getDraftKey = (draftId) => `${DRAFT_KEY_PREFIX}${draftId}`;
const parseDraftTtl = () => {
    const configured = Number(process.env.DRAFT_ORDER_TTL_SECONDS);
    if (Number.isFinite(configured) && configured > 0) {
        return Math.max(60, Math.floor(configured));
    }
    return DEFAULT_TTL_SECONDS;
};
const ensureRedisClient = async () => {
    await (0, redis_util_1.connectRedis)();
    return (0, redis_util_1.getRedisClient)();
};
// ─── Stock reservation ────────────────────────────────────────────────────────
/**
 * Reserves stock for all items atomically within a MongoDB session/transaction.
 *
 * WHY A SESSION IS REQUIRED:
 *   Without a session every `findOneAndUpdate` is its own isolated operation.
 *   Two concurrent requests that both read `stock: 1` can both pass the
 *   `$gte: 1` filter and both decrement, leaving `stock: -1` (oversell).
 *
 *   Wrapping all updates inside a single session means MongoDB serialises the
 *   writes for each document — the second writer sees the committed result of
 *   the first and will get `null` back from `findOneAndUpdate`, which we
 *   translate into a clear "Insufficient stock" error.
 *
 * NOTE: The caller is responsible for starting the session and calling
 *   `session.withTransaction(...)`.  This function must be called *inside*
 *   that callback so it participates in the same transaction.
 */
const reserveStockForItems = async (items, session) => {
    if (items.length === 0) {
        throw new Error('Must reserve stock for at least one item');
    }
    const normalizedItems = items.map((item) => ({
        ...item,
        productSize: (0, order_constants_1.normalizeSize)(item.productSize),
    }));
    const uniqueProductIds = [
        ...new Set(normalizedItems.map((item) => item.productId)),
    ];
    // Read current product state *inside the transaction session* so the reads
    // are consistent with the writes that follow.
    const products = await Product_1.default.find({ _id: { $in: uniqueProductIds } }).session(session).lean();
    if (products.length !== uniqueProductIds.length) {
        throw new Error('One or more products not found');
    }
    const productMap = new Map(products.map((product) => [product._id.toString(), product]));
    // Perform all stock decrements within the same session.
    // Promise.all is fine here — MongoDB's WiredTiger engine serialises
    // writes to the same document, so two concurrent writes to product P
    // will not interleave; the transaction boundary provides the safety net.
    const stockUpdates = await Promise.all(normalizedItems.map((item) => {
        const product = productMap.get(item.productId);
        const hasSizeMatch = Boolean(item.productSize) &&
            product?.sizes?.some((s) => s.size === item.productSize);
        /**
         * Filter ensures stock is sufficient *at write time* (not just at read
         * time).  If another concurrent transaction already consumed the stock,
         * MongoDB will return null here, triggering the error below.
         */
        const filter = hasSizeMatch
            ? {
                _id: item.productId,
                sizes: {
                    $elemMatch: {
                        size: item.productSize,
                        stock: { $gte: item.quantity },
                    },
                },
                stock: { $gte: item.quantity },
            }
            : {
                _id: item.productId,
                stock: { $gte: item.quantity },
            };
        const update = hasSizeMatch
            ? { $inc: { 'sizes.$.stock': -item.quantity, stock: -item.quantity } }
            : { $inc: { stock: -item.quantity } };
        return Product_1.default.findOneAndUpdate(filter, update, {
            new: true,
            session, // ← participates in the caller's transaction
        });
    }));
    stockUpdates.forEach((result, index) => {
        if (!result) {
            const item = normalizedItems[index];
            const product = productMap.get(item.productId);
            const sizeLabel = item.productSize ? ` in size ${item.productSize}` : '';
            throw new Error(`Insufficient stock for "${product?.name ?? item.productId}"${sizeLabel}`);
        }
    });
    return { normalizedItems, productMap };
};
exports.reserveStockForItems = reserveStockForItems;
/**
 * Restores stock for all items in a draft.
 * Called when a draft expires or is explicitly cancelled.
 * No session needed here — each update is idempotent and independent.
 */
const restoreStockForItems = async (items) => {
    if (items.length === 0)
        return;
    await Promise.all(items.map((item) => {
        const hasSizeMatch = Boolean(item.productSize);
        const filter = hasSizeMatch
            ? { _id: item.productId, 'sizes.size': item.productSize }
            : { _id: item.productId };
        const update = hasSizeMatch
            ? { $inc: { 'sizes.$.stock': item.quantity, stock: item.quantity } }
            : { $inc: { stock: item.quantity } };
        return Product_1.default.findOneAndUpdate(filter, update);
    }));
};
exports.restoreStockForItems = restoreStockForItems;
// ─── Draft CRUD ───────────────────────────────────────────────────────────────
/**
 * Creates a draft order.
 *
 * Stock is reserved atomically inside a MongoDB transaction so concurrent
 * requests for the same limited-stock product are safely serialised.
 *
 * Coupon validation happens at finalization (not here) because:
 *   - We don't want to penalise the coupon count for drafts that expire or are
 *     abandoned before payment.
 *   - The draft TTL is up to 15 minutes — a coupon could expire in that window
 *     and is re-checked at finalize time.
 */
const createDraftOrder = async (payload) => {
    const session = await mongoose_2.default.startSession();
    try {
        // All stock decrements happen inside a single ACID transaction.
        const { normalizedItems, productMap } = await session.withTransaction(async () => {
            return (0, exports.reserveStockForItems)(payload.items, session);
        });
        const draftItems = normalizedItems.map((item) => {
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
        const shippingCost = order_constants_1.SHIPPING_COSTS[payload.shippingMethod] ?? 0;
        let discountAmount = 0;
        if (payload.couponCode) {
            const coupon = await (0, coupon_service_1.getCouponByCode)(payload.couponCode);
            if (!coupon) {
                throw new Error(`Coupon "${payload.couponCode}" not found`);
            }
            if (new Date(coupon.expiration_date) < new Date()) {
                throw new Error(`Coupon "${payload.couponCode}" has expired`);
            }
            if (coupon.count <= 0) {
                throw new Error(`Coupon "${payload.couponCode}" has no remaining uses`);
            }
            discountAmount = Math.min(subtotal * (coupon.discount / 100), subtotal);
        }
        const taxableAmount = subtotal - discountAmount;
        const tax = parseFloat((taxableAmount * order_constants_1.TAX_RATE).toFixed(2));
        const totalAmount = parseFloat((subtotal - discountAmount + shippingCost + tax).toFixed(2));
        const draftId = (0, crypto_1.randomUUID)();
        const ttlSeconds = parseDraftTtl();
        const now = Date.now();
        const expiresAt = now + ttlSeconds * 1000;
        const draft = {
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
    }
    finally {
        session.endSession();
    }
};
exports.createDraftOrder = createDraftOrder;
const getDraft = async (draftId) => {
    const client = await ensureRedisClient();
    const payload = await client.get(getDraftKey(draftId));
    if (!payload)
        return null;
    try {
        return JSON.parse(payload);
    }
    catch {
        throw new Error('Stored draft payload is invalid');
    }
};
exports.getDraft = getDraft;
const deleteDraft = async (draftId) => {
    const client = await ensureRedisClient();
    await client.del(getDraftKey(draftId));
};
// ─── Draft finalization ───────────────────────────────────────────────────────
/**
 * Finalizes a draft order into a persisted Order + OrderItems.
 *
 * COUPON CONSUMPTION happens here (not at draft creation) because:
 *   - We only charge the coupon quota when the customer actually completes
 *     payment, preventing abandoned-cart quota drain.
 *   - The atomic `findOneAndUpdate` in `validateAndConsumeCoupon` ensures that
 *     even if two finalization requests race (e.g. return URL + IPN both fire),
 *     only one of them can decrement the counter.  The second will receive a
 *     null result and throw, which is safe — the draft will already be gone.
 *
 * DRAFT DELETION:
 *   The draft is removed from Redis *before* writing to MongoDB.  If the
 *   Mongo transaction fails we re-insert the draft so the customer can retry.
 *   This "delete-then-restore-on-error" pattern prevents the double-finalization
 *   race (return URL + IPN) at the cost of a small restore window on failure.
 */
const finalizeDraftOrder = async (draftId) => {
    const draft = await (0, exports.getDraft)(draftId);
    if (!draft) {
        throw new Error('Draft order not found or already finalized');
    }
    // Remove draft from Redis first — acts as a lightweight mutex.
    // Any concurrent finalization attempt will call getDraft() and get null,
    // hitting the error above before reaching the expensive DB work.
    await deleteDraft(draftId);
    const session = await mongoose_2.default.startSession();
    try {
        const result = await session.withTransaction(async () => {
            // ── Coupon validation & atomic consumption ─────────────────────────
            // Validate coupon at finalization time so:
            //   1. Expiry is re-checked (15-min draft window could cross expiry).
            //   2. Quota is only consumed when payment is confirmed.
            //   3. Concurrent finalizations (IPN + return URL) can't both consume.
            if (draft.couponCode) {
                const coupon = await (0, coupon_service_1.validateAndConsumeCoupon)(draft.couponCode, session);
                if (!coupon) {
                    throw new Error(`Coupon "${draft.couponCode}" is invalid, expired, or fully redeemed`);
                }
            }
            // ── Persist order ──────────────────────────────────────────────────
            return (0, exports.createOrderFromDraft)(draft, session);
        });
        return result;
    }
    catch (error) {
        // Transaction failed — restore the draft so the customer can retry.
        // TTL is set to remaining time (minimum 60 s) so we don't extend it.
        const remainingTtlSeconds = Math.max(60, Math.floor((draft.expiresAt - Date.now()) / 1000));
        const client = await ensureRedisClient();
        await client.set(getDraftKey(draftId), JSON.stringify(draft), {
            EX: remainingTtlSeconds,
        });
        throw error;
    }
    finally {
        session.endSession();
    }
};
exports.finalizeDraftOrder = finalizeDraftOrder;
// ─── Order persistence (called from finalizeDraftOrder) ───────────────────────
const createOrderFromDraft = async (draft, session) => {
    const [order] = await Order_1.default.create([
        {
            customerId: new mongoose_1.Types.ObjectId(draft.customerId),
            orderNumber: (0, order_constants_1.generateOrderNumber)(),
            status: 'pending',
            payment_status: 'pending',
            total_amount: draft.totals.totalAmount,
            subtotal: draft.totals.subtotal,
            shipping_cost: draft.totals.shippingCost,
            tax: draft.totals.tax,
            shipping_address: draft.shippingAddress,
            shipping_method: draft.shippingMethod,
            payment_method: draft.paymentMethod,
            coupon_code: draft.couponCode,
        },
    ], { session });
    const orderItemsPayload = draft.items.map((item) => ({
        orderId: order._id,
        productId: new mongoose_1.Types.ObjectId(item.productId),
        quantity: item.quantity,
        productSize: item.productSize ?? order_constants_1.DEFAULT_SIZE_LABEL,
        unit_price: item.unit_price,
    }));
    const orderItems = (await OrderItem_1.default.insertMany(orderItemsPayload, { session }));
    return { order, orderItems };
};
exports.createOrderFromDraft = createOrderFromDraft;
// ─── Draft cancellation ───────────────────────────────────────────────────────
const cancelDraftOrder = async (draftId) => {
    const draft = await (0, exports.getDraft)(draftId);
    if (!draft)
        return null;
    await (0, exports.restoreStockForItems)(draft.items);
    await deleteDraft(draftId);
    return draft;
};
exports.cancelDraftOrder = cancelDraftOrder;
const cleanupExpiredDrafts = async () => {
    const client = await ensureRedisClient();
    const iterator = client.scanIterator({
        MATCH: `${DRAFT_KEY_PREFIX}*`,
        COUNT: 100,
    });
    let cancelledCount = 0;
    for await (const batch of iterator) {
        const keys = Array.isArray(batch) ? batch : [batch];
        for (const rawKey of keys) {
            const key = typeof rawKey === 'string' ? rawKey : rawKey.toString();
            try {
                const payload = await client.get(key);
                if (!payload)
                    continue;
                const draft = JSON.parse(payload);
                if (Date.now() >= draft.expiresAt) {
                    const cancelled = await (0, exports.cancelDraftOrder)(draft.draftId);
                    if (cancelled) {
                        cancelledCount += 1;
                    }
                }
            }
            catch (error) {
                console.error(`Failed to inspect draft key "${key}"`, error);
            }
        }
    }
    return cancelledCount;
};
exports.cleanupExpiredDrafts = cleanupExpiredDrafts;
