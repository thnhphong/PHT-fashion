import type { Request, Response } from 'express';
import couponService from '../services/coupon.service';
//add count to the coupon
export const createCouponController = async (req: Request, res: Response) => {
  try {
    const coupon = await couponService.createCoupon(req.body);
    return res.status(201).json({ message: 'Coupon created successfully', coupon });
  } catch (error: any) {
    console.error('Coupon creation error:', error);
    return res.status(400).json({ message: error.message || 'Unable to create coupon' });
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
