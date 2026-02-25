import paypal from 'paypal-rest-sdk';
import { IOrder } from '../models/Order';
import { CurrencyConverter } from '../utils/currency.util';

// Configure PayPal environment

paypal.configure({
    mode: process.env.PAYPAL_MODE || 'sandbox', // sandbox or live
    client_id: process.env.PAYPAL_CLIENT_ID || 'YOUR_PAYPAL_CLIENT_ID',
    client_secret: process.env.PAYPAL_CLIENT_SECRET || 'YOUR_PAYPAL_CLIENT_SECRET',
});

/**
 * Creates a PayPal payment order and returns the approval URL
 * @param order The database order document
 * @param baseUrl The base URL of the API server (e.g. http://localhost:5000) for callbacks
 */
export const createPayPalPayment = (order: IOrder, baseUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        // Convert VND total to USD string
        const totalUsd = CurrencyConverter.vndToUsd(order.total_amount);

        const create_payment_json = {
            intent: 'sale',
            payer: {
                payment_method: 'paypal',
            },
            redirect_urls: {
                return_url: `${baseUrl}/api/payments/paypal/success?orderId=${order._id}`,
                cancel_url: `${baseUrl}/api/payments/paypal/cancel?orderId=${order._id}`,
            },
            transactions: [
                {
                    item_list: {
                        items: [
                            {
                                name: `Order ${order.orderNumber}`,
                                sku: order._id.toString(),
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
                    description: `Payment for Order ${order.orderNumber}`,
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
