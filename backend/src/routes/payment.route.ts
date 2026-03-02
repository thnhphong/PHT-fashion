import { Router } from 'express';
import { payWithPayPal, payPalSuccess, payPalCancel, payWithVNPay, vnpayReturn, vnpayIpn } from '../controllers/payment.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// POST /api/payments/paypal/create-order/:draftId
router.post('/paypal/create-order/:draftId', authenticate, payWithPayPal);

// GET /api/payments/paypal/success (public callback for PayPal)
router.get('/paypal/success', payPalSuccess);

// GET /api/payments/paypal/cancel (public callback for PayPal)
router.get('/paypal/cancel', payPalCancel);

// POST /api/payments/vnpay/create-order/:draftId
router.post('/vnpay/create-order/:draftId', authenticate, payWithVNPay);

// GET /api/payments/vnpay/return
router.get('/vnpay/return', vnpayReturn);

// GET /api/payments/vnpay/ipn
router.post('/vnpay/ipn', vnpayIpn);

export default router;
