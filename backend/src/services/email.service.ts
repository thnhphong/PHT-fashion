import nodemailer from 'nodemailer';
import { env } from '../config/env';

export interface OrderConfirmationEmailPayload {
  to: string;
  customerName: string;
  orderNumber: string;
  shippingMethod: string;
  paymentMethod: string;
  subtotal: number;
  shippingCost: number;
  tax: number;
  totalAmount: number;
  couponCode?: string;
  shippingAddress: {
    fullName: string;
    apartment?: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    unit_price: number;
    productSize: string;
  }>;
}

const transporter = nodemailer.createTransport({
  host: env.emailHost,
  port: env.emailPort,
  secure: env.emailSecure,
  auth: {
    user: env.emailUser,
    pass: env.emailPass,
  },
});

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(value);

export const sendOrderConfirmationEmail = async (payload: OrderConfirmationEmailPayload) => {
  const itemsHtml = payload.items
    .map(
      (item) =>
        `<li>${item.name} (Size ${item.productSize}) — ${item.quantity} × ${formatCurrency(
          item.unit_price
        )}</li>`
    )
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
      from: env.emailUser,
      to: payload.to,
      subject: `Order confirmation — ${payload.orderNumber}`,
      html,
    });
  } catch (error) {
    console.error('Failed to send order confirmation email:', error);
  }
};
