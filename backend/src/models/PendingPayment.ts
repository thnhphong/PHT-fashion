import { Schema, model, Document, Types } from 'mongoose';

export type PendingPaymentStatus = 'awaiting_payment' | 'completed' | 'expired' | 'cancelled';

export interface IPendingPayment extends Document {
  userId: Types.ObjectId;
  draftId: string;
  paymentMethod: 'paypal' | 'vnpay';
  totalAmount: number;
  items: Array<{
    productId: Types.ObjectId;
    productSize?: string;
    quantity: number;
    unit_price: number;
    productName: string;
  }>;
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
  shippingMethod: string;
  couponCode?: string;
  status: PendingPaymentStatus;
  expiresAt: Date;
  orderId?: Types.ObjectId;
  created_at: Date;
}

const PendingPaymentSchema = new Schema<IPendingPayment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    draftId: { type: String, required: true, unique: true },
    paymentMethod: { type: String, enum: ['paypal', 'vnpay'], required: true },
    totalAmount: { type: Number, required: true, min: 0 },
    items: [
      {
        productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        productSize: { type: String },
        quantity: { type: Number, required: true, min: 1 },
        unit_price: { type: Number, required: true, min: 0 },
        productName: { type: String, required: true },
        _id: false,
      },
    ],
    shippingAddress: {
      fullName: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
      street: { type: String, required: true },
      apartment: { type: String },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      country: { type: String, required: true },
      _id: false,
    },
    shippingMethod: { type: String, required: true },
    couponCode: { type: String },
    status: {
      type: String,
      enum: ['awaiting_payment', 'completed', 'expired', 'cancelled'],
      default: 'awaiting_payment',
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      // Auto-delete 1 hour AFTER expiresAt so our cleanup job can mark status
      // as 'expired' before MongoDB removes the document.
      index: { expires: 3600 },
    },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
    created_at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

export default model<IPendingPayment>('PendingPayment', PendingPaymentSchema);