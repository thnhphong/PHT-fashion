import { Schema, model, Document } from 'mongoose';

export interface ICoupon extends Document {
  name: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  scope: 'all' | 'product' | 'category';
  productIds?: Types.ObjectId[];
  categoryIds?: Types.ObjectId[];
  usage_limit: number;
  expiration_date: Date;
  created_at?: Date;
}

const CouponSchema = new Schema<ICoupon>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    discount_type: { type: String, enum: ['percentage', 'fixed'], default: 'percentage', required: true },
    discount_value: { type: Number, required: true, min: 0 },
    scope: { type: String, enum: ['all', 'product', 'category'], default: 'all', required: true },
    productIds: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    categoryIds: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
    usage_limit: { type: Number, required: true, min: 0 },
    expiration_date: { type: Date, required: true },
    created_at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

export default model<ICoupon>('Coupon', CouponSchema);
