"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProduct = exports.updateProduct = exports.getProductById = exports.getFeaturedProducts = exports.getProducts = exports.createProduct = void 0;
const mongoose_1 = require("mongoose");
const product_service_1 = __importDefault(require("../services/product.service"));
const cloudinary_1 = require("../config/cloudinary");
const pagination_1 = require("../utils/pagination");
const imageFields = ['img_url', 'thumbnail_img_1', 'thumbnail_img_2', 'thumbnail_img_3', 'thumbnail_img_4'];
const uploadFirstFile = async (files, field) => {
    if (!files)
        return undefined;
    const match = files[field];
    if (!match || match.length === 0)
        return undefined;
    const file = match[0];
    const uploaded = await (0, cloudinary_1.uploadImage)(file.path);
    return uploaded.secure_url || uploaded.url;
};
const buildImagePayload = async (files) => {
    const payload = {};
    for (const field of imageFields) {
        const url = await uploadFirstFile(files, field);
        if (url) {
            payload[field] = url;
        }
    }
    return payload;
};
const normalizeField = (value) => {
    if (!value)
        return undefined;
    return Array.isArray(value) ? value[0] : value;
};
const castToObjectId = (value) => {
    const normalized = normalizeField(value);
    if (!normalized)
        return undefined;
    return new mongoose_1.Types.ObjectId(normalized);
};
const createProduct = async (req, res) => {
    try {
        const name = normalizeField(req.body.name);
        const description = normalizeField(req.body.description);
        const price = normalizeField(req.body.price);
        const categoryId = normalizeField(req.body.categoryId);
        const supplierId = normalizeField(req.body.supplierId);
        const stock = normalizeField(req.body.stock);
        const sizes = normalizeField(req.body.sizes);
        const files = req.files;
        const productImages = await buildImagePayload(files);
        const product = await product_service_1.default.createProduct({
            name,
            description,
            price: Number(price),
            categoryId: castToObjectId(categoryId),
            supplierId: castToObjectId(supplierId),
            stock: Number(stock),
            sizes: sizes ? JSON.parse(sizes) : undefined,
            ...productImages,
        });
        return res.status(201).json({ message: 'Product created', product });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Unable to create product', error });
    }
};
exports.createProduct = createProduct;
const getProducts = async (req, res) => {
    try {
        const paginationParams = (0, pagination_1.parsePaginationParams)(req.query);
        const result = await product_service_1.default.getProducts(paginationParams);
        return res.json(result);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Unable to fetch products', error });
    }
};
exports.getProducts = getProducts;
const getFeaturedProducts = async (req, res) => {
    try {
        const paginationParams = (0, pagination_1.parsePaginationParams)(req.query);
        const result = await product_service_1.default.getFeaturedProducts(paginationParams);
        return res.json(result);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Unable to fetch featured products', error });
    }
};
exports.getFeaturedProducts = getFeaturedProducts;
const getProductById = async (req, res) => {
    try {
        const product = await product_service_1.default.getProductById(String(req.params.id));
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        return res.json(product);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Unable to fetch product', error });
    }
};
exports.getProductById = getProductById;
const updateProduct = async (req, res) => {
    try {
        const updatePayload = { ...req.body };
        const categoriesField = castToObjectId(req.body.categoryId);
        if (categoriesField) {
            updatePayload.categoryId = categoriesField;
        }
        const supplierField = castToObjectId(req.body.supplierId);
        if (supplierField) {
            updatePayload.supplierId = supplierField;
        }
        const sizesField = normalizeField(req.body.sizes);
        if (sizesField) {
            updatePayload.sizes = JSON.parse(sizesField);
        }
        if (updatePayload.price && typeof updatePayload.price !== 'string') {
            updatePayload.price = Array.isArray(updatePayload.price) ? updatePayload.price[0] : updatePayload.price;
        }
        if (updatePayload.stock && typeof updatePayload.stock !== 'string') {
            updatePayload.stock = Array.isArray(updatePayload.stock) ? updatePayload.stock[0] : updatePayload.stock;
        }
        if (updatePayload.price)
            updatePayload.price = Number(updatePayload.price);
        if (updatePayload.stock)
            updatePayload.stock = Number(updatePayload.stock);
        const files = req.files;
        const imageUpdates = await buildImagePayload(files);
        const payloadToUpdate = { ...updatePayload, ...imageUpdates };
        const product = await product_service_1.default.updateProductById(String(req.params.id), payloadToUpdate);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        return res.json({ message: 'Product updated', product });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Unable to update product', error });
    }
};
exports.updateProduct = updateProduct;
const deleteProduct = async (req, res) => {
    try {
        const deleted = await product_service_1.default.deleteProductById(String(req.params.id));
        if (!deleted) {
            return res.status(404).json({ message: 'Product not found' });
        }
        return res.json({ message: 'Product deleted' });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Unable to delete product', error });
    }
};
exports.deleteProduct = deleteProduct;
