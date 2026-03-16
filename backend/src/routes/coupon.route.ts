import { Router } from 'express';
import { createCouponController, validateCouponController, listCouponsController } from '../controllers/coupon.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireAdminEmail } from '../middlewares/role.middleware';
import { validateRequest } from '../middlewares/validateRequest';
import { createCouponSchema } from '../validations/coupon.validation';

const router = Router();

router.get('/', listCouponsController);
router.get('/:code', validateCouponController);
router.post('/', authenticate, requireAdminEmail, validateRequest(createCouponSchema), createCouponController);

export default router;
