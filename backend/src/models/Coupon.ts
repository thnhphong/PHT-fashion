import { Schema, model, Document } from 'mongoose';

export interface ICoupon extends Document {
  name: string;
  code: string;
  created_at: Date;
}

const CouponSchema = new Schema<ICoupon>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      unique: true,
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false,
  }
);

export default model<ICoupon>('Coupon', CouponSchema);

