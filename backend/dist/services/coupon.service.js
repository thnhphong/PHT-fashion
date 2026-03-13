"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.restoreCouponCount = exports.validateAndConsumeCoupon = exports.createCoupon = exports.listCoupons = exports.getCouponByCode = void 0;
const Coupon_1 = __importDefault(require("../models/Coupon"));
// ─── Read-only helpers (unchanged) ───────────────────────────────────────────
/**
 * Returns coupon metadata for display purposes only (e.g. showing the
 * discount % in the cart UI).  Does NOT decrement the count — consumption
 * is deferred to order finalization via `validateAndConsumeCoupon`.
 */
const getCouponByCode = async (code) => {
    return Coupon_1.default.findOne({ code: code.toUpperCase() }).lean();
};
exports.getCouponByCode = getCouponByCode;
const listCoupons = async () => {
    return Coupon_1.default.find().sort({ created_at: -1 }).lean();
};
exports.listCoupons = listCoupons;
// ─── Write helpers ────────────────────────────────────────────────────────────
const createCoupon = async (payload) => {
    if (payload.count < 0 || payload.count > 100) {
        throw new Error('Count must be between 0 and 100');
    }
    const existingCoupon = await Coupon_1.default.findOne({ code: payload.code.toUpperCase() });
    if (existingCoupon) {
        throw new Error('Coupon code already exists');
    }
    const coupon = new Coupon_1.default(payload);
    return coupon.save();
};
exports.createCoupon = createCoupon;
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
const validateAndConsumeCoupon = async (code, session) => {
    const now = new Date();
    const filter = {
        code: code.toUpperCase(),
        expiration_date: { $gte: now }, // not yet expired
        count: { $gt: 0 }, // still has remaining uses
    };
    const update = {
        $inc: { count: -1 }, // atomically consume one use
    };
    return Coupon_1.default.findOneAndUpdate(filter, update, {
        new: true, // return post-update document
        ...(session ? { session } : {}),
    });
};
exports.validateAndConsumeCoupon = validateAndConsumeCoupon;
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
const restoreCouponCount = async (couponCode, session) => {
    await Coupon_1.default.findOneAndUpdate({ code: couponCode.toUpperCase() }, { $inc: { count: 1 } }, { ...(session ? { session } : {}) });
};
exports.restoreCouponCount = restoreCouponCount;
exports.default = {
    createCoupon: exports.createCoupon,
    getCouponByCode: exports.getCouponByCode,
    listCoupons: exports.listCoupons,
    validateAndConsumeCoupon: exports.validateAndConsumeCoupon,
    restoreCouponCount: exports.restoreCouponCount,
};
