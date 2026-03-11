"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCategory = exports.updateCategory = exports.getCategoryById = exports.getCategories = exports.createCategory = void 0;
const mongoose_1 = require("mongoose");
const category_service_1 = __importDefault(require("../services/category.service"));
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
const createCategory = async (req, res) => {
    try {
        const name = normalizeField(req.body.name);
        if (!name) {
            return res.status(400).json({ message: 'Name is required' });
        }
        const category = await category_service_1.default.createCategory({ name });
        return res.status(201).json({ message: 'Category created', category });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Unable to create category', error });
    }
};
exports.createCategory = createCategory;
const getCategories = async (_req, res) => {
    try {
        const categories = await category_service_1.default.getCategories();
        return res.json(categories);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Unable to fetch categories', error });
    }
};
exports.getCategories = getCategories;
const getCategoryById = async (req, res) => {
    try {
        const category = await category_service_1.default.getCategoryById(String(req.params.id));
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        return res.json(category);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Unable to fetch category by id', error });
    }
};
exports.getCategoryById = getCategoryById;
const updateCategory = async (req, res) => {
    try {
        const updatePayload = { ...req.body };
        const categoryId = castToObjectId(req.params.id);
        if (!categoryId) {
            return res.status(400).json({ message: 'Category ID is required' });
        }
        const category = await category_service_1.default.updateCategoryById(categoryId.toString(), updatePayload);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        return res.json({ message: 'Category updated', category });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Unable to update category', error });
    }
};
exports.updateCategory = updateCategory;
const deleteCategory = async (req, res) => {
    try {
        const categoryId = castToObjectId(req.params.id);
        if (!categoryId) {
            return res.status(400).json({ message: 'Category ID is required' });
        }
        const category = await category_service_1.default.deleteCategoryById(categoryId.toString());
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        return res.json({ message: 'Category deleted', category });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Unable to delete category by id', error });
    }
};
exports.deleteCategory = deleteCategory;
