"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const ProductCardSchema = new mongoose_1.Schema({
    productId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    img_url: { type: String, required: true },
    slug: { type: String, required: true },
}, { _id: false });
const MessageSchema = new mongoose_1.Schema({
    conversationId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true,
    },
    senderId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    senderRole: {
        type: String,
        enum: ['customer', 'admin'],
        required: true,
    },
    type: {
        type: String,
        enum: ['text', 'image', 'product_card'],
        required: true,
    },
    content: { type: String },
    imageUrl: { type: String },
    imagePublicId: { type: String },
    product: { type: ProductCardSchema },
    status: {
        type: String,
        enum: ['sent', 'delivered'],
        default: 'sent',
    },
    createdAt: { type: Date, default: Date.now },
}, { versionKey: false });
MessageSchema.index({ conversationId: 1, _id: -1 });
MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1 });
exports.default = (0, mongoose_1.model)('Message', MessageSchema, 'messages');
