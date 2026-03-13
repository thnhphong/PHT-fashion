"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const PendingPaymentSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    draftId: { type: String, required: true, unique: true },
    paymentMethod: { type: String, enum: ['paypal', 'vnpay'], required: true },
    totalAmount: { type: Number, required: true, min: 0 },
    items: [
        {
            productId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Product', required: true },
            productSize: { type: String },
            quantity: { type: Number, required: true, min: 1 },
            unit_price: { type: Number, required: true, min: 0 },
            productName: { type: String, required: true },
            _id: false,
        },
    ],
    shippingAddress: {
        fullName: { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String, required: true },
        street: { type: String, required: true },
        apartment: { type: String },
        city: { type: String, required: true },
        state: { type: String, required: true },
        zipCode: { type: String, required: true },
        country: { type: String, required: true },
        _id: false,
    },
    shippingMethod: { type: String, required: true },
    couponCode: { type: String },
    status: {
        type: String,
        enum: ['awaiting_payment', 'completed', 'expired', 'cancelled'],
        default: 'awaiting_payment',
        index: true,
    },
    expiresAt: {
        type: Date,
        required: true,
        // Auto-delete 1 hour AFTER expiresAt so our cleanup job can mark status
        // as 'expired' before MongoDB removes the document.
        index: { expires: 3600 },
    },
    orderId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Order' },
    paymentId: { type: String, trim: true },
    created_at: { type: Date, default: Date.now },
}, { versionKey: false });
exports.default = (0, mongoose_1.model)('PendingPayment', PendingPaymentSchema);
