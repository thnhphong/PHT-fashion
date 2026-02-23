import type { Request, Response } from 'express';
import couponService from '../services/coupon.service';
//add count to the coupon
export const createCouponController = async (req: Request, res: Response) => {
  try {
    const { name, code, discount, count, expiration_date } = req.body;
    if (!name || !code || !discount || !count || !expiration_date) {
      return res.status(400).json({ message: 'Missing required coupon fields' });
    }
    if (count < 0 || count > 100) {
      return res.status(400).json({ message: 'Count must be between 0 and 100' });
    }
    const coupon = await couponService.createCoupon({ name, code, discount, count, expiration_date });
    return res.status(201).json({ message: 'Coupon created successfully', coupon });
  } catch (error) {
    console.error('Coupon creation error:', error);
    return res.status(500).json({ message: 'Unable to create coupon', error });
  }
};

export const validateCouponController = async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    if (!code) {
      return res.status(400).json({ message: 'Coupon code is required' });
    }
    const coupon = await couponService.getCouponByCode(code as string);
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }
    if (new Date(coupon.expiration_date) < new Date()) {
      return res.status(400).json({ message: 'Coupon expired' });
    }
    return res.json({ coupon });
  } catch (error) {
    console.error('Validate coupon error:', error);
    return res.status(500).json({ message: 'Unable to verify coupon', error });
  }
};

export const listCouponsController = async (_req: Request, res: Response) => {
  try {
    const coupons = await couponService.listCoupons();
    return res.json({ coupons });
  } catch (error) {
    console.error('List coupons error:', error);
    return res.status(500).json({ message: 'Unable to load coupons', error });
  }
};
