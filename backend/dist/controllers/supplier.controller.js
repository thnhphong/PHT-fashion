"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSupplier = exports.updateSupplier = exports.createSupplier = exports.getSupplierById = exports.getAllSuppliers = void 0;
const supplierService = __importStar(require("../services/suplier.service"));
const normalizeParam = (value) => {
    if (!value)
        return undefined;
    return Array.isArray(value) ? value[0] : value;
};
const getAllSuppliers = async (_req, res) => {
    const suppliers = await supplierService.getAllSuppliers();
    res.status(200).json(suppliers);
};
exports.getAllSuppliers = getAllSuppliers;
const getSupplierById = async (req, res) => {
    try {
        const supplierId = normalizeParam(req.params.id);
        if (!supplierId) {
            return res.status(400).json({ message: 'Supplier ID is required' });
        }
        const supplier = await supplierService.getSupplierById(supplierId);
        if (!supplier) {
            return res.status(404).json({ message: 'Supplier not found' });
        }
        return res.status(200).json(supplier);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Unable to fetch supplier', error });
    }
};
exports.getSupplierById = getSupplierById;
const createSupplier = async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name || !description) {
            return res.status(400).json({ message: 'Name and description are required' });
        }
        const supplier = await supplierService.createSupplier({ name, description });
        return res.status(201).json({ message: 'Supplier created', supplier });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Unable to create supplier', error });
    }
};
exports.createSupplier = createSupplier;
const updateSupplier = async (req, res) => {
    try {
        const supplierId = normalizeParam(req.params.id);
        if (!supplierId) {
            return res.status(400).json({ message: 'Supplier ID is required' });
        }
        const supplier = await supplierService.updateSupplierById(supplierId, req.body);
        if (!supplier) {
            return res.status(404).json({ message: 'Supplier not found' });
        }
        return res.status(200).json({ message: 'Supplier updated', supplier });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Unable to update supplier', error });
    }
};
exports.updateSupplier = updateSupplier;
const deleteSupplier = async (req, res) => {
    try {
        const supplierId = normalizeParam(req.params.id);
        if (!supplierId) {
            return res.status(400).json({ message: 'Supplier ID is required' });
        }
        const supplier = await supplierService.deleteSupplierById(supplierId);
        if (!supplier) {
            return res.status(404).json({ message: 'Supplier not found' });
        }
        return res.status(200).json({ message: 'Supplier deleted' });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Unable to delete supplier', error });
    }
};
exports.deleteSupplier = deleteSupplier;
