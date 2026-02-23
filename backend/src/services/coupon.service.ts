import Coupon, { type ICoupon } from '../models/Coupon';

export const createCoupon = async (payload: {
  name: string;
  code: string;
  discount: number;
  count: number;
  expiration_date: Date;
}) => {
  const coupon = new Coupon(payload);
  if (payload.count < 0 || payload.count > 100) {
    throw new Error('Count must be between 0 and 100');
  }
  const existingCoupon = await Coupon.findOne({ code: payload.code.toUpperCase() });
  if (existingCoupon) {
    throw new Error('Coupon code already exists');
  }
  return coupon.save();
};

export const getCouponByCode = async (code: string) => {
  return Coupon.findOne({ code: code.toUpperCase() }).lean();
};

export const listCoupons = async () => {
  return Coupon.find().sort({ created_at: -1 }).lean();
};

export default {
  createCoupon,
  getCouponByCode,
  listCoupons,
};