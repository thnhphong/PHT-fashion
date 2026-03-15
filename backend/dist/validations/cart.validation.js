"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeCartSchema = exports.removeCartItemSchema = exports.updateCartItemSchema = exports.addCartItemSchema = void 0;
const zod_1 = require("zod");
exports.addCartItemSchema = zod_1.z.object({
    productId: zod_1.z.string().min(1, 'Product ID is required'),
    size: zod_1.z.string().min(1, 'Size is required'),
    quantity: zod_1.z.number().int().min(1, 'Quantity must be at least 1'),
});
exports.updateCartItemSchema = zod_1.z.object({
    size: zod_1.z.string().min(1, 'Size is required'),
    quantity: zod_1.z.number().int().min(1, 'Quantity must be at least 1'),
});
exports.removeCartItemSchema = zod_1.z.object({
    size: zod_1.z.string().min(1, 'Size is required'),
});
exports.mergeCartSchema = zod_1.z.object({
    items: zod_1.z.array(zod_1.z.object({
        productId: zod_1.z.string().min(1),
        size: zod_1.z.string().min(1),
        quantity: zod_1.z.number().int().min(1),
    })),
});
