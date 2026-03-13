"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSupplierById = exports.updateSupplierById = exports.createSupplier = exports.getSupplierById = exports.getAllSuppliers = void 0;
const Supplier_1 = __importDefault(require("../models/Supplier"));
const getAllSuppliers = async () => {
    return Supplier_1.default.find().select('_id name description created_at').sort({ name: 1 });
};
exports.getAllSuppliers = getAllSuppliers;
const getSupplierById = async (id) => {
    return Supplier_1.default.findById(id);
};
exports.getSupplierById = getSupplierById;
const createSupplier = async (payload) => {
    return Supplier_1.default.create(payload);
};
exports.createSupplier = createSupplier;
const updateSupplierById = async (id, payload) => {
    return Supplier_1.default.findByIdAndUpdate(id, payload, { new: true });
};
exports.updateSupplierById = updateSupplierById;
const deleteSupplierById = async (id) => {
    return Supplier_1.default.findByIdAndDelete(id);
};
exports.deleteSupplierById = deleteSupplierById;
