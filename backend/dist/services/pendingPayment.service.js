"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPendingPaymentByDraftId = exports.cancelPendingPayment = exports.checkPaymentIdempotency = exports.completePendingPayment = exports.getPendingPaymentsForUser = exports.createPendingPayment = void 0;
const PendingPayment_1 = __importDefault(require("../models/PendingPayment"));
const mongoose_1 = require("mongoose");
/**
 * Creates a PendingPayment record in MongoDB when a user initiates PayPal/VNPay.
 * This survives browser closure and Redis TTL — gives users the "resume payment" UX.
 */
const createPendingPayment = async (userId, draft, productNames) => {
    // Idempotent — if user re-initiates for the same draftId, return existing record
    const existing = await PendingPayment_1.default.findOne({ draftId: draft.draftId });
    if (existing)
        return existing;
    return PendingPayment_1.default.create({
        userId: new mongoose_1.Types.ObjectId(userId),
        draftId: draft.draftId,
        paymentMethod: draft.paymentMethod,
        totalAmount: draft.totals.totalAmount,
        items: draft.items.map((item) => ({
            productId: new mongoose_1.Types.ObjectId(item.productId),
            productSize: item.productSize,
            quantity: item.quantity,
            unit_price: item.unit_price,
            productName: productNames.get(item.productId) ?? 'Unknown Product',
        })),
        shippingAddress: draft.shippingAddress,
        shippingMethod: draft.shippingMethod,
        couponCode: draft.couponCode,
        status: 'awaiting_payment',
        // expiresAt comes directly from the draft (already set to 24 h in Redis)
        expiresAt: new Date(draft.expiresAt),
    });
};
exports.createPendingPayment = createPendingPayment;
/**
 * Returns active pending payments for a user.
 * Also lazily marks any that have passed expiresAt as 'expired'.
 */
const getPendingPaymentsForUser = async (userId) => {
    const records = await PendingPayment_1.default.find({
        userId: new mongoose_1.Types.ObjectId(userId),
        status: { $in: ['awaiting_payment', 'expired'] },
    })
        .sort({ created_at: -1 })
        .lean();
    // Lazily flip status to 'expired' for any that have passed their deadline
    const now = new Date();
    const expiredIds = records
        .filter((r) => r.status === 'awaiting_payment' && new Date(r.expiresAt) < now)
        .map((r) => r._id);
    if (expiredIds.length > 0) {
        await PendingPayment_1.default.updateMany({ _id: { $in: expiredIds } }, { $set: { status: 'expired' } });
    }
    return PendingPayment_1.default.find({
        userId: new mongoose_1.Types.ObjectId(userId),
        status: { $in: ['awaiting_payment', 'expired'] },
    })
        .sort({ created_at: -1 })
        .lean();
};
exports.getPendingPaymentsForUser = getPendingPaymentsForUser;
/**
 * Marks a pending payment as completed and links it to the finalized Order.
 */
const completePendingPayment = async (draftId, orderId, paymentId) => {
    const updatePayload = { status: 'completed', orderId: new mongoose_1.Types.ObjectId(orderId) };
    if (paymentId) {
        updatePayload.paymentId = paymentId;
    }
    await PendingPayment_1.default.findOneAndUpdate({ draftId }, { $set: updatePayload });
};
exports.completePendingPayment = completePendingPayment;
/**
 * Checks if a payment with the given paymentId has already been completed.
 * Used to enforce idempotency in payment webhook callbacks.
 */
const checkPaymentIdempotency = async (paymentId) => {
    if (!paymentId)
        return false;
    const existing = await PendingPayment_1.default.findOne({
        paymentId,
        status: 'completed',
    });
    return !!existing;
};
exports.checkPaymentIdempotency = checkPaymentIdempotency;
/**
 * Marks a pending payment as cancelled (user explicitly cancelled the payment).
 */
const cancelPendingPayment = async (draftId) => {
    await PendingPayment_1.default.findOneAndUpdate({ draftId }, { $set: { status: 'cancelled' } });
};
exports.cancelPendingPayment = cancelPendingPayment;
/**
 * Fetches a single pending payment by draftId, scoped to a user if provided.
 */
const getPendingPaymentByDraftId = async (draftId, userId) => {
    const query = { draftId };
    if (userId)
        query.userId = new mongoose_1.Types.ObjectId(userId);
    return PendingPayment_1.default.findOne(query).lean();
};
exports.getPendingPaymentByDraftId = getPendingPaymentByDraftId;
