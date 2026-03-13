"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Category_1 = __importDefault(require("../models/Category"));
const createCategory = async (payload) => {
    return Category_1.default.create(payload);
};
const getCategories = async () => {
    return Category_1.default.find().select('_id name').sort({ name: 1 });
};
const getCategoryById = async (id) => {
    return Category_1.default.findById(id).select('_id name');
};
const updateCategoryById = async (id, payload) => {
    return Category_1.default.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
};
const deleteCategoryById = async (id) => {
    return Category_1.default.findByIdAndDelete(id);
};
exports.default = {
    createCategory,
    getCategories,
    getCategoryById,
    updateCategoryById,
    deleteCategoryById,
};
