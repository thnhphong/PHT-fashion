"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/services/product.service.ts
const Product_1 = __importDefault(require("../models/Product"));
const OrderItem_1 = __importDefault(require("../models/OrderItem"));
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
const getBestSellers = async (params) => {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const sort = params.sort ?? 'relevance';
    const order = params.order ?? 'desc';
    const skip = (page - 1) * limit;
    const orderStatusFilter = { status: { $ne: 'cancelled' } };
    const bestSellerData = await OrderItem_1.default.aggregate([
        {
            $lookup: {
                from: 'orders',
                localField: 'orderId',
                foreignField: '_id',
                as: 'order'
            }
        },
        { $unwind: '$order' },
        { $match: orderStatusFilter },
        {
            $group: {
                _id: '$productId',
                totalSold: { $sum: '$quantity' }
            }
        },
        { $sort: { totalSold: -1 } },
        { $skip: skip },
        { $limit: limit }
    ]);
    if (bestSellerData.length === 0) {
        return (0, pagination_1.buildPaginationResult)([], 0, page, limit);
    }
    const productIds = bestSellerData.map((item) => item._id);
    const productMap = new Map(bestSellerData.map((item) => [item._id.toString(), item.totalSold]));
    let sortOptions = {};
    if (sort === 'price-asc')
        sortOptions = { price: 1 };
    else if (sort === 'price-desc')
        sortOptions = { price: -1 };
    else
        sortOptions = { created_at: -1 };
    const products = await Product_1.default.find({ _id: { $in: productIds } })
        .sort(sortOptions)
        .populate('categoryId', 'name')
        .populate('supplierId', 'name')
        .lean();
    const sortedProducts = productIds.map((id) => {
        const product = products.find(p => p._id.toString() === id.toString());
        if (product) {
            return { ...product, totalSold: productMap.get(id.toString()) };
        }
        return null;
    }).filter(Boolean);
    const totalItems = await OrderItem_1.default.aggregate([
        {
            $lookup: {
                from: 'orders',
                localField: 'orderId',
                foreignField: '_id',
                as: 'order'
            }
        },
        { $unwind: '$order' },
        { $match: orderStatusFilter },
        {
            $group: {
                _id: '$productId'
            }
        },
        { $count: 'total' }
    ]);
    const total = totalItems[0]?.total || 0;
    return (0, pagination_1.buildPaginationResult)(sortedProducts, total, page, limit);
};
exports.default = {
    createProduct,
    getProducts,
    getFeaturedProducts,
    getProductById,
    updateProductById,
    deleteProductById,
    getBestSellers,
};
