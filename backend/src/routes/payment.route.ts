import { Router } from 'express';
import {
  getMyPendingPayments,
  payWithPayPal,
  resumePayPalPayment,
  payPalSuccess,
  payPalCancel,
  payWithVNPay,
  resumeVNPayPayment,
  vnpayReturn,
  vnpayIpn,
} from '../controllers/payment.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// GET  /api/payments/pending                    → list user's active pending payments
router.get('/pending', authenticate, getMyPendingPayments);

// POST /api/payments/paypal/create-order/:draftId  → initiate PayPal checkout
router.post('/paypal/create-order/:draftId', authenticate, payWithPayPal);

// POST /api/payments/guest/paypal/create-order/:draftId  → initiate guest PayPal checkout
router.post('/guest/paypal/create-order/:draftId', payWithPayPal);

// POST /api/payments/paypal/resume/:draftId         → resume an existing pending PayPal payment
router.post('/paypal/resume/:draftId', authenticate, resumePayPalPayment);

// GET  /api/payments/paypal/success                 → PayPal redirect callback (public)
router.get('/paypal/success', payPalSuccess);

// GET  /api/payments/paypal/cancel                  → PayPal cancel callback (public)
router.get('/paypal/cancel', payPalCancel);

// POST /api/payments/vnpay/create-order/:draftId    → initiate VNPay checkout
router.post('/vnpay/create-order/:draftId', authenticate, payWithVNPay);

// POST /api/payments/guest/vnpay/create-order/:draftId    → initiate guest VNPay checkout
router.post('/guest/vnpay/create-order/:draftId', payWithVNPay);

// POST /api/payments/vnpay/resume/:draftId          → resume an existing pending VNPay payment
router.post('/vnpay/resume/:draftId', authenticate, resumeVNPayPayment);

// GET  /api/payments/vnpay/return                   → VNPay redirect callback (public)
router.get('/vnpay/return', vnpayReturn);

// POST /api/payments/vnpay/ipn                      → VNPay server-to-server IPN (public)
router.post('/vnpay/ipn', vnpayIpn);

export default router;