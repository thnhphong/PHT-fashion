"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.executePayPalPayment = exports.createPayPalPayment = exports.verifyVNPayIpn = exports.verifyVNPayReturn = exports.createVNPayPayment = void 0;
const paypal_rest_sdk_1 = __importDefault(require("paypal-rest-sdk"));
const vnpay_1 = require("vnpay");
const currency_util_1 = require("../utils/currency.util");
const vnpay = new vnpay_1.VNPay({
    tmnCode: process.env.VNP_TMNCODE,
    secureSecret: process.env.VNP_SECRET,
    vnpayHost: 'https://sandbox.vnpayment.vn',
    testMode: process.env.NODE_ENV !== 'production',
    hashAlgorithm: vnpay_1.HashAlgorithm.SHA512,
    enableLog: process.env.NODE_ENV === 'development',
    loggerFn: vnpay_1.ignoreLogger,
});
/**
 * Creates a VNPay payment URL and returns it for client redirect.
 * @param draft   The draft order stored in Redis
 * @param ipAddr  The customer's IP address
 * @param baseUrl The API base URL (e.g. http://localhost:5000)
 */
const createVNPayPayment = (draft, ipAddr, baseUrl) => {
    // VNPay requires amount in VND (whole number, no decimals)
    const amount = Math.round(draft.totals.totalAmount);
    const paymentUrl = vnpay.buildPaymentUrl({
        vnp_Amount: amount,
        vnp_IpAddr: ipAddr,
        vnp_TxnRef: draft.draftId,
        vnp_OrderInfo: `Payment for draft ${draft.draftId}`,
        vnp_OrderType: vnpay_1.ProductCode.Other,
        vnp_ReturnUrl: `${baseUrl}/api/payments/vnpay/return`,
        vnp_Locale: vnpay_1.VnpLocale.VN,
    });
    return paymentUrl;
};
exports.createVNPayPayment = createVNPayPayment;
/**
 * Verifies the return URL parameters from VNPay after the customer completes payment.
 */
const verifyVNPayReturn = (query) => {
    return vnpay.verifyReturnUrl(query);
};
exports.verifyVNPayReturn = verifyVNPayReturn;
/**
 * Verifies an IPN (Instant Payment Notification) call from VNPay servers.
 */
const verifyVNPayIpn = (query) => {
    return vnpay.verifyIpnCall(query);
};
exports.verifyVNPayIpn = verifyVNPayIpn;
// Configure PayPal environment
paypal_rest_sdk_1.default.configure({
    mode: process.env.PAYPAL_MODE || 'sandbox', // sandbox or live
    client_id: process.env.PAYPAL_CLIENT_ID || 'YOUR_PAYPAL_CLIENT_ID',
    client_secret: process.env.PAYPAL_CLIENT_SECRET || 'YOUR_PAYPAL_CLIENT_SECRET',
});
/**
 * Creates a PayPal payment order and returns the approval URL
 * @param draft The draft order data backed by Redis
 * @param baseUrl The base URL of the API server (e.g. http://localhost:5000) for callbacks
 */
const createPayPalPayment = (draft, baseUrl) => {
    return new Promise((resolve, reject) => {
        // Convert draft total from VND to USD string
        const totalUsd = currency_util_1.CurrencyConverter.vndToUsd(draft.totals.totalAmount);
        const create_payment_json = {
            intent: 'sale',
            payer: {
                payment_method: 'paypal',
            },
            redirect_urls: {
                return_url: `${baseUrl}/api/payments/paypal/success?draftId=${draft.draftId}`,
                cancel_url: `${baseUrl}/api/payments/paypal/cancel?draftId=${draft.draftId}`,
            },
            transactions: [
                {
                    item_list: {
                        items: [
                            {
                                name: `Draft ${draft.draftId}`,
                                sku: draft.draftId,
                                price: totalUsd,
                                currency: 'USD',
                                quantity: 1,
                            },
                        ],
                    },
                    amount: {
                        currency: 'USD',
                        total: totalUsd,
                    },
                    description: `Payment for draft ${draft.draftId}`,
                },
            ],
        };
        paypal_rest_sdk_1.default.payment.create(create_payment_json, (error, payment) => {
            if (error) {
                console.error('PayPal create payment error:', error.response || error);
                reject(new Error('Failed to create PayPal payment'));
            }
            else {
                // Find the approval URL to redirect the user
                const approvalUrl = payment.links?.find((link) => link.rel === 'approval_url');
                if (approvalUrl) {
                    resolve(approvalUrl.href);
                }
                else {
                    reject(new Error('Approval URL not found in PayPal response'));
                }
            }
        });
    });
};
exports.createPayPalPayment = createPayPalPayment;
/**
 * Executes (captures) an approved PayPal payment
 * @param paymentId The payment ID from PayPal
 * @param payerId The Payer ID from PayPal
 */
const executePayPalPayment = (paymentId, payerId) => {
    return new Promise((resolve, reject) => {
        const execute_payment_json = {
            payer_id: payerId,
        };
        paypal_rest_sdk_1.default.payment.execute(paymentId, execute_payment_json, (error, payment) => {
            if (error) {
                console.error('PayPal execute payment error:', error.response || error);
                reject(new Error('Failed to execute PayPal payment'));
            }
            else {
                resolve(payment);
            }
        });
    });
};
exports.executePayPalPayment = executePayPalPayment;
