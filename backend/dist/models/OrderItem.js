"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const OrderItemSchema = new mongoose_1.Schema({
    orderId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Order',
        required: true,
        index: true,
    },
    productId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        min: [1, 'Quantity must be at least 1'],
    },
    productSize: {
        type: String,
        required: true,
        trim: true,
        uppercase: true,
    },
    unit_price: {
        type: Number,
        required: true,
        min: 0,
    },
}, {
    versionKey: false,
});
exports.default = (0, mongoose_1.model)('OrderItem', OrderItemSchema, 'orderItems');
