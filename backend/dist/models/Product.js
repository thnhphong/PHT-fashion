"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const ProductSizeSchema = new mongoose_1.Schema({
    size: {
        type: String,
        required: true,
        trim: true,
    },
    stock: {
        type: Number,
        required: true,
        min: 0,
    },
}, { _id: false });
const defaultSizes = ['XS', 'S', 'M', 'L', 'XL'].map((size) => ({
    size,
    stock: 20,
}));
const ProductSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
        trim: true,
    },
    price: {
        type: Number,
        required: true,
        min: 0,
    },
    categoryId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Category',
        required: true,
    },
    supplierId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Supplier',
        required: true,
    },
    stock: {
        type: Number,
        required: true,
        min: 0,
    },
    img_url: {
        type: String,
        required: true,
    },
    thumbnail_img_1: {
        type: String,
    },
    thumbnail_img_2: {
        type: String,
    },
    thumbnail_img_3: {
        type: String,
    },
    thumbnail_img_4: {
        type: String,
    },
    sizes: {
        type: [ProductSizeSchema],
        default: defaultSizes,
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
}, {
    versionKey: false,
});
// Index for text search
ProductSchema.index({ name: 'text', description: 'text' });
// Index for category search combined with text search
ProductSchema.index({ categoryId: 1 });
exports.default = (0, mongoose_1.model)('Product', ProductSchema);
