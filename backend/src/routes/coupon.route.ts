import { Router } from 'express';
import { createCouponController, validateCouponController, listCouponsController } from '../controllers/coupon.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireAdminEmail } from '../middlewares/role.middleware';

const router = Router();

router.get('/', listCouponsController);
router.get('/:code', validateCouponController);
router.post('/', authenticate, requireAdminEmail, createCouponController);

export default router;
