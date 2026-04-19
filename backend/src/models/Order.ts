import { Schema, model, Document, Types } from 'mongoose';

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface IShippingAddress {
  fullName: string;
  email: string;
  phone: string;
  street: string;
  apartment?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface IOrder extends Document {
  customerId?: Types.ObjectId;
  orderNumber: string;
  status: OrderStatus;
  subtotal: number;
  shipping_cost: number;
  tax: number;
  shipping_address: IShippingAddress;
  shipping_method: 'standard' | 'express' | 'next_day';
  payment_method: 'credit_card' | 'paypal' | 'apple_pay' | 'google_pay' | 'cash_on_delivery' | 'vnpay';
  coupon_code?: string;
  total_amount: number;
  payment_status: PaymentStatus;
  created_at: Date;
  __v?: number;
}

const ShippingAddressSchema = new Schema<IShippingAddress>(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    street: {
      type: String,
      required: true,
      trim: true,
    },
    apartment: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    zipCode: {
      type: String,
      required: true,
      trim: true,
    },
    country: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    total_amount: {
      type: Number,
      required: true,
      min: 0,
    },
    payment_status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    shipping_cost: {
      type: Number,
      required: true,
      min: 0,
    },
    tax: {
      type: Number,
      required: true,
      min: 0,
    },
    shipping_address: {
      type: ShippingAddressSchema,
      required: true,
    },
    shipping_method: {
      type: String,
      enum: ['standard', 'express', 'next_day'],
      required: true,
    },
    payment_method: {
      type: String,
      enum: ['credit_card', 'paypal', 'apple_pay', 'google_pay', 'cash_on_delivery', 'vnpay'],
      required: true,
    },
    coupon_code: {
      type: String,
      trim: true,
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: '__v',
  }
);

export default model<IOrder>('Order', OrderSchema);

