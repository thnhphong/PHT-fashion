import mongoose from 'mongoose';
import Coupon, { type ICoupon } from '../models/Coupon';

// ─── Read-only helpers (unchanged) ───────────────────────────────────────────

/**
 * Returns coupon metadata for display purposes only (e.g. showing the
 * discount % in the cart UI).  Does NOT decrement the count — consumption
 * is deferred to order finalization via `validateAndConsumeCoupon`.
 */
export const getCouponByCode = async (code: string) => {
  return Coupon.findOne({ code: code.toUpperCase() })
    .populate('productIds', 'name')
    .populate('categoryIds', 'name')
    .lean();
};

export const listCoupons = async () => {
  return Coupon.find().sort({ created_at: -1 }).lean();
};

// ─── Write helpers ────────────────────────────────────────────────────────────

export const createCoupon = async (payload: any) => {
  const code = payload.code.toUpperCase();
  const existingCoupon = await Coupon.findOne({ code });
  if (existingCoupon) {
    throw new Error('Coupon code already exists');
  }
  const coupon = new Coupon({ ...payload, code });
  return coupon.save();
};

// ─── Atomic consumption ───────────────────────────────────────────────────────

/**
 * Validates a coupon and atomically decrements its usage count in one
 * database round-trip.
 *
 * WHY THIS IS SAFE AGAINST RACE CONDITIONS:
 *   MongoDB's `findOneAndUpdate` with a compound filter is a single atomic
 *   write operation.  The filter checks three conditions simultaneously:
 *     1. Code matches (case-insensitive via stored UPPERCASE value)
 *     2. Coupon has not yet expired  (`expiration_date >= now`)
 *     3. At least one use remains   (`count > 0`)
 *
 *   If two concurrent requests both call this function for the last remaining
 *   use (count = 1), MongoDB's WiredTiger engine serialises the writes.
 *   The first writer decrements count to 0 and returns the coupon document.
 *   The second writer finds `count: { $gt: 0 }` no longer satisfied and
 *   returns null — triggering the "coupon exhausted" error path in the caller.
 *
 * SESSION PARAMETER:
 *   Pass a `ClientSession` when calling from inside a MongoDB transaction
 *   (e.g. `finalizeDraftOrder`) so the decrement participates in the same
 *   ACID transaction.  If the outer transaction aborts, the decrement is
 *   automatically rolled back — no manual restore needed.
 *
 * @returns The updated coupon document (with decremented count), or null if
 *          the coupon doesn't exist, is expired, or has no remaining uses.
 */
export const validateAndConsumeCoupon = async (
  code: string,
  session?: mongoose.ClientSession,
): Promise<ICoupon | null> => {
  const now = new Date();

  const filter = {
    code: code.toUpperCase(),
    expiration_date: { $gte: now }, // not yet expired
    usage_limit: { $gt: 0 },         // still has remaining uses
  };

  const update = {
    $inc: { usage_limit: -1 }, // atomically consume one use
  };

  return Coupon.findOneAndUpdate(filter, update, {
    new: true,            // return post-update document
    ...(session ? { session } : {}),
  });
};

/**
 * Restores one coupon use when an order is cancelled or a finalization
 * transaction is rolled back manually (outside a transaction boundary).
 *
 * Inside a MongoDB transaction you do NOT need to call this — the transaction
 * rollback automatically reverts the `$inc` from `validateAndConsumeCoupon`.
 *
 * Call this only when restoring a coupon for an already-persisted cancelled
 * order (e.g. customer cancels a confirmed order that used a coupon).
 */
export const restoreCouponCount = async (
  couponCode: string,
  session?: mongoose.ClientSession,
): Promise<void> => {
  await Coupon.findOneAndUpdate(
    { code: couponCode.toUpperCase() },
    { $inc: { usage_limit: 1 } },
    { ...(session ? { session } : {}) },
  );
};

/**
 * Validates if a coupon applies to a given set of cart items.
 */
export const isCouponApplicable = (
  coupon: ICoupon,
  cartItems: Array<{ productId: string; categoryId?: string }>
): boolean => {
  if (coupon.scope === 'all') return true;

  if (coupon.scope === 'product') {
    return cartItems.some((item) =>
      coupon.productIds?.some((pid) => pid.toString() === item.productId.toString())
    );
  }

  if (coupon.scope === 'category') {
    return cartItems.some((item) =>
      coupon.categoryIds?. some((cid) => cid.toString() === item.categoryId?.toString())
    );
  }

  return false;
};

export default {
  createCoupon,
  getCouponByCode,
  listCoupons,
  validateAndConsumeCoupon,
  restoreCouponCount,
};