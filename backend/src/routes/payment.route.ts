import { Router } from 'express';
import { payWithPayPal, payPalSuccess, payPalCancel } from '../controllers/payment.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// POST /api/payments/paypal/create-order/:orderId
router.post('/paypal/create-order/:orderId', authenticate, payWithPayPal);

// GET /api/payments/paypal/success (public callback for PayPal)
router.get('/paypal/success', payPalSuccess);

// GET /api/payments/paypal/cancel (public callback for PayPal)
router.get('/paypal/cancel', payPalCancel);

export default router;
