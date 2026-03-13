"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/services/product.service.ts
const Product_1 = __importDefault(require("../models/Product"));
const pagination_1 = require("../utils/pagination");
const createProduct = async (payload) => {
    return Product_1.default.create(payload);
};
const getProducts = async (params) => {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;
    const sort = params.sort ?? 'created_at';
    const order = params.order ?? 'desc';
    const skip = (page - 1) * limit;
    const sortOrder = order === 'asc' ? 1 : -1;
    const total = await Product_1.default.countDocuments();
    const data = await Product_1.default.find()
        .sort({ [sort]: sortOrder })
        .skip(skip)
        .limit(limit)
        .populate('categoryId', 'name')
        .populate('supplierId', 'name');
    return (0, pagination_1.buildPaginationResult)(data, total, page, limit);
};
const getFeaturedProducts = async (params) => {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;
    const sort = params.sort ?? 'created_at';
    const order = params.order ?? 'desc';
    const skip = (page - 1) * limit;
    const sortOrder = order === 'asc' ? 1 : -1;
    const total = await Product_1.default.countDocuments();
    const data = await Product_1.default.find()
        .sort({ [sort]: sortOrder })
        .skip(skip)
        .limit(limit)
        .populate('categoryId', 'name')
        .populate('supplierId', 'name');
    return (0, pagination_1.buildPaginationResult)(data, total, page, limit);
};
const getProductById = async (id) => {
    return Product_1.default.findById(id)
        .populate('categoryId', 'name')
        .populate('supplierId', 'name');
};
const updateProductById = async (id, payload) => {
    return Product_1.default.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
};
const deleteProductById = async (id) => {
    return Product_1.default.findByIdAndDelete(id);
};
exports.default = {
    createProduct,
    getProducts,
    getFeaturedProducts,
    getProductById,
    updateProductById,
    deleteProductById,
};
