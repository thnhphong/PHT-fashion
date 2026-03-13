import PendingPayment, { IPendingPayment } from '../models/PendingPayment';
import { DraftOrderData } from './draftOrder.service';
import { Types } from 'mongoose';

/**
 * Creates a PendingPayment record in MongoDB when a user initiates PayPal/VNPay.
 * This survives browser closure and Redis TTL — gives users the "resume payment" UX.
 */
export const createPendingPayment = async (
  userId: string,
  draft: DraftOrderData,
  productNames: Map<string, string>
): Promise<IPendingPayment> => {
  // Idempotent — if user re-initiates for the same draftId, return existing record
  const existing = await PendingPayment.findOne({ draftId: draft.draftId });
  if (existing) return existing;

  return PendingPayment.create({
    userId: new Types.ObjectId(userId),
    draftId: draft.draftId,
    paymentMethod: draft.paymentMethod as 'paypal' | 'vnpay',
    totalAmount: draft.totals.totalAmount,
    items: draft.items.map((item) => ({
      productId: new Types.ObjectId(item.productId),
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

/**
 * Returns active pending payments for a user.
 * Also lazily marks any that have passed expiresAt as 'expired'.
 */
export const getPendingPaymentsForUser = async (userId: string) => {
  const records = await PendingPayment.find({
    userId: new Types.ObjectId(userId),
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
    await PendingPayment.updateMany(
      { _id: { $in: expiredIds } },
      { $set: { status: 'expired' } }
    );
  }

  return PendingPayment.find({
    userId: new Types.ObjectId(userId),
    status: { $in: ['awaiting_payment', 'expired'] },
  })
    .sort({ created_at: -1 })
    .lean();
};

/**
 * Marks a pending payment as completed and links it to the finalized Order.
 */
export const completePendingPayment = async (
  draftId: string,
  orderId: string,
  paymentId?: string
): Promise<void> => {
  const updatePayload: any = { status: 'completed', orderId: new Types.ObjectId(orderId) };
  if (paymentId) {
    updatePayload.paymentId = paymentId;
  }

  await PendingPayment.findOneAndUpdate(
    { draftId },
    { $set: updatePayload }
  );
};

/**
 * Checks if a payment with the given paymentId has already been completed.
 * Used to enforce idempotency in payment webhook callbacks.
 */
export const checkPaymentIdempotency = async (
  paymentId: string
): Promise<boolean> => {
  if (!paymentId) return false;
  const existing = await PendingPayment.findOne({
    paymentId,
    status: 'completed',
  });
  return !!existing;
};

/**
 * Marks a pending payment as cancelled (user explicitly cancelled the payment).
 */
export const cancelPendingPayment = async (draftId: string): Promise<void> => {
  await PendingPayment.findOneAndUpdate(
    { draftId },
    { $set: { status: 'cancelled' } }
  );
};

/**
 * Fetches a single pending payment by draftId, scoped to a user if provided.
 */
export const getPendingPaymentByDraftId = async (
  draftId: string,
  userId?: string
): Promise<IPendingPayment | null> => {
  const query: any = { draftId };
  if (userId) query.userId = new Types.ObjectId(userId);
  return PendingPayment.findOne(query).lean() as Promise<IPendingPayment | null>;
};