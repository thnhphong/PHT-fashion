"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const payment_controller_1 = require("../controllers/payment.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// GET  /api/payments/pending                    → list user's active pending payments
router.get('/pending', auth_middleware_1.authenticate, payment_controller_1.getMyPendingPayments);
// POST /api/payments/paypal/create-order/:draftId  → initiate PayPal checkout
router.post('/paypal/create-order/:draftId', auth_middleware_1.authenticate, payment_controller_1.payWithPayPal);
// POST /api/payments/paypal/resume/:draftId         → resume an existing pending PayPal payment
router.post('/paypal/resume/:draftId', auth_middleware_1.authenticate, payment_controller_1.resumePayPalPayment);
// GET  /api/payments/paypal/success                 → PayPal redirect callback (public)
router.get('/paypal/success', payment_controller_1.payPalSuccess);
// GET  /api/payments/paypal/cancel                  → PayPal cancel callback (public)
router.get('/paypal/cancel', payment_controller_1.payPalCancel);
// POST /api/payments/vnpay/create-order/:draftId    → initiate VNPay checkout
router.post('/vnpay/create-order/:draftId', auth_middleware_1.authenticate, payment_controller_1.payWithVNPay);
// POST /api/payments/vnpay/resume/:draftId          → resume an existing pending VNPay payment
router.post('/vnpay/resume/:draftId', auth_middleware_1.authenticate, payment_controller_1.resumeVNPayPayment);
// GET  /api/payments/vnpay/return                   → VNPay redirect callback (public)
router.get('/vnpay/return', payment_controller_1.vnpayReturn);
// POST /api/payments/vnpay/ipn                      → VNPay server-to-server IPN (public)
router.post('/vnpay/ipn', payment_controller_1.vnpayIpn);
exports.default = router;
