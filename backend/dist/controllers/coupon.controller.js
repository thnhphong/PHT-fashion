"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listCouponsController = exports.validateCouponController = exports.createCouponController = void 0;
const coupon_service_1 = __importDefault(require("../services/coupon.service"));
//add count to the coupon
const createCouponController = async (req, res) => {
    try {
        const { name, code, discount, count, expiration_date } = req.body;
        if (!name || !code || !discount || !count || !expiration_date) {
            return res.status(400).json({ message: 'Missing required coupon fields' });
        }
        if (count < 0 || count > 100) {
            return res.status(400).json({ message: 'Count must be between 0 and 100' });
        }
        const coupon = await coupon_service_1.default.createCoupon({ name, code, discount, count, expiration_date });
        return res.status(201).json({ message: 'Coupon created successfully', coupon });
    }
    catch (error) {
        console.error('Coupon creation error:', error);
        return res.status(500).json({ message: 'Unable to create coupon', error });
    }
};
exports.createCouponController = createCouponController;
const validateCouponController = async (req, res) => {
    try {
        const { code } = req.params;
        if (!code) {
            return res.status(400).json({ message: 'Coupon code is required' });
        }
        const coupon = await coupon_service_1.default.getCouponByCode(code);
        if (!coupon) {
            return res.status(404).json({ message: 'Coupon not found' });
        }
        if (new Date(coupon.expiration_date) < new Date()) {
            return res.status(400).json({ message: 'Coupon expired' });
        }
        return res.json({ coupon });
    }
    catch (error) {
        console.error('Validate coupon error:', error);
        return res.status(500).json({ message: 'Unable to verify coupon', error });
    }
};
exports.validateCouponController = validateCouponController;
const listCouponsController = async (_req, res) => {
    try {
        const coupons = await coupon_service_1.default.listCoupons();
        return res.json({ coupons });
    }
    catch (error) {
        console.error('List coupons error:', error);
        return res.status(500).json({ message: 'Unable to load coupons', error });
    }
};
exports.listCouponsController = listCouponsController;
