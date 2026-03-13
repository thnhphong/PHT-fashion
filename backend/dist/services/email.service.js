"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendOrderConfirmationEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const env_1 = require("../config/env");
const transporter = nodemailer_1.default.createTransport({
    host: env_1.env.emailHost,
    port: env_1.env.emailPort,
    secure: env_1.env.emailSecure,
    auth: {
        user: env_1.env.emailUser,
        pass: env_1.env.emailPass,
    },
});
const formatCurrency = (value) => new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
}).format(value);
const sendOrderConfirmationEmail = async (payload) => {
    const itemsHtml = payload.items
        .map((item) => `<li>${item.name} (Size ${item.productSize}) — ${item.quantity} × ${formatCurrency(item.unit_price)}</li>`)
        .join('');
    const html = `
    <p>Hi ${payload.customerName},</p>
    <p>Thank you for your purchase! We have received your order <strong>${payload.orderNumber}</strong>.</p>
    <h3>Order summary</h3>
    <ul>${itemsHtml}</ul>
    <p>Subtotal: ${formatCurrency(payload.subtotal)}</p>
    <p>Shipping (${payload.shippingMethod}): ${formatCurrency(payload.shippingCost)}</p>
    <p>Tax: ${formatCurrency(payload.tax)}</p>
    <p><strong>Total: ${formatCurrency(payload.totalAmount)}</strong></p>
    <p>Payment method: ${payload.paymentMethod.replace(/_/g, ' ')}</p>
    <h3>Shipping address</h3>
    <p>${payload.shippingAddress.fullName}</p>
    <p>
      ${payload.shippingAddress.street}${payload.shippingAddress.apartment ? `, ${payload.shippingAddress.apartment}` : ''}
    </p>
    <p>
      ${payload.shippingAddress.city}, ${payload.shippingAddress.state} ${payload.shippingAddress.zipCode}
    </p>
    <p>${payload.shippingAddress.country}</p>
    <p>Phone: ${payload.shippingAddress.phone}</p>
    ${payload.couponCode ? `<p>Coupon applied: ${payload.couponCode}</p>` : ''}
    <p>If you have questions or need to make changes, reply to this email.</p>
    <p>Cheers,<br/>PHT Fashion Team</p>
  `;
    try {
        await transporter.sendMail({
            from: env_1.env.emailUser,
            to: payload.to,
            subject: `Order confirmation — ${payload.orderNumber}`,
            html,
        });
    }
    catch (error) {
        console.error('Failed to send order confirmation email:', error);
    }
};
exports.sendOrderConfirmationEmail = sendOrderConfirmationEmail;
