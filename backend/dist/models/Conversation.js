"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const LastMessageSchema = new mongoose_1.Schema({
    content: { type: String, required: true },
    sentAt: { type: Date, required: true },
    senderId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
}, { _id: false });
const ConversationSchema = new mongoose_1.Schema({
    customerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    lastMessage: {
        type: LastMessageSchema,
        required: true,
    },
    customerUnread: { type: Number, default: 0 },
    adminUnread: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
}, { versionKey: false });
ConversationSchema.index({ customerId: 1 });
ConversationSchema.index({ updatedAt: -1 });
ConversationSchema.index({ customerId: 1, updatedAt: -1 });
exports.default = (0, mongoose_1.model)('Conversation', ConversationSchema, 'conversations');
