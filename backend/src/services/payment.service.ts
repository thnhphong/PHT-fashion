import paypal from 'paypal-rest-sdk';
import { VNPay, ProductCode, VnpLocale, ignoreLogger, HashAlgorithm, ReturnQueryFromVNPay } from 'vnpay';
import { CurrencyConverter } from '../utils/currency.util';
import type { DraftOrderData } from './draftOrder.service';

const vnpay = new VNPay({
    tmnCode: process.env.VNP_TMNCODE as string,
    secureSecret: process.env.VNP_SECRET as string,
    vnpayHost: 'https://sandbox.vnpayment.vn',
    testMode: process.env.NODE_ENV !== 'production',
    hashAlgorithm: HashAlgorithm.SHA512,
    enableLog: process.env.NODE_ENV === 'development',
    loggerFn: ignoreLogger,
});
/**
 * Creates a VNPay payment URL and returns it for client redirect.
 * @param draft   The draft order stored in Redis
 * @param ipAddr  The customer's IP address
 * @param baseUrl The API base URL (e.g. http://localhost:5000)
 */
export const createVNPayPayment = (
    draft: DraftOrderData,
    ipAddr: string,
    baseUrl: string,
): string => {
    // VNPay requires amount in VND (whole number, no decimals)
    const amount = Math.round(draft.totals.totalAmount);

    const paymentUrl = vnpay.buildPaymentUrl({
        vnp_Amount: amount,
        vnp_IpAddr: ipAddr,
        vnp_TxnRef: draft.draftId,
        vnp_OrderInfo: `Payment for draft ${draft.draftId}`,
        vnp_OrderType: ProductCode.Other,
        vnp_ReturnUrl: `${baseUrl}/api/payments/vnpay/return`,
        vnp_Locale: VnpLocale.VN,
    });

    return paymentUrl;
};
/**
 * Verifies the return URL parameters from VNPay after the customer completes payment.
 */
export const verifyVNPayReturn = (query: ReturnQueryFromVNPay) => {
    return vnpay.verifyReturnUrl(query);
};

/**
 * Verifies an IPN (Instant Payment Notification) call from VNPay servers.
 */
export const verifyVNPayIpn = (query: ReturnQueryFromVNPay) => {
    return vnpay.verifyIpnCall(query);
};


// Configure PayPal environment

paypal.configure({
    mode: process.env.PAYPAL_MODE || 'sandbox', // sandbox or live
    client_id: process.env.PAYPAL_CLIENT_ID || 'YOUR_PAYPAL_CLIENT_ID',
    client_secret: process.env.PAYPAL_CLIENT_SECRET || 'YOUR_PAYPAL_CLIENT_SECRET',
});

/**
 * Creates a PayPal payment order and returns the approval URL
 * @param draft The draft order data backed by Redis
 * @param baseUrl The base URL of the API server (e.g. http://localhost:5000) for callbacks
 */
export const createPayPalPayment = (draft: DraftOrderData, baseUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        // Convert draft total from VND to USD string
        const totalUsd = CurrencyConverter.vndToUsd(draft.totals.totalAmount);

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

        paypal.payment.create(create_payment_json, (error: any, payment: any) => {
            if (error) {
                console.error('PayPal create payment error:', error.response || error);
                reject(new Error('Failed to create PayPal payment'));
            } else {
                // Find the approval URL to redirect the user
                const approvalUrl = payment.links?.find((link: any) => link.rel === 'approval_url');
                if (approvalUrl) {
                    resolve(approvalUrl.href);
                } else {
                    reject(new Error('Approval URL not found in PayPal response'));
                }
            }
        });
    });
};

/**
 * Executes (captures) an approved PayPal payment
 * @param paymentId The payment ID from PayPal
 * @param payerId The Payer ID from PayPal
 */
export const executePayPalPayment = (paymentId: string, payerId: string): Promise<paypal.PaymentResponse> => {
    return new Promise((resolve, reject) => {
        const execute_payment_json = {
            payer_id: payerId,
        };

        paypal.payment.execute(paymentId, execute_payment_json, (error: any, payment: any) => {
            if (error) {
                console.error('PayPal execute payment error:', error.response || error);
                reject(new Error('Failed to execute PayPal payment'));
            } else {
                resolve(payment);
            }
        });
    });
};
