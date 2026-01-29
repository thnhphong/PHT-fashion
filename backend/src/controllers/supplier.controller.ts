import { Request, Response } from 'express';
import * as supplierService from '../services/suplier.service';

const normalizeParam = (value: string | string[] | undefined): string | undefined => {
  if (!value) return undefined;
  return Array.isArray(value) ? value[0] : value;
};

export const getAllSuppliers = async (_req: Request, res: Response) => {
  const suppliers = await supplierService.getAll();
  res.status(200).json(suppliers);
};

export const getSupplierById = async (req: Request, res: Response) => {
  try {
    const supplierId = normalizeParam(req.params.id);
    if (!supplierId) {
      return res.status(400).json({ message: 'Supplier ID is required' });
    }
    const supplier = await supplierService.getById(supplierId);
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }
    return res.status(200).json(supplier);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to fetch supplier', error });
  }
};

export const createSupplier = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    if (!name || !description) {
      return res.status(400).json({ message: 'Name and description are required' });
    }
    const supplier = await supplierService.create({ name, description });
    return res.status(201).json({ message: 'Supplier created', supplier });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to create supplier', error });
  }
};

export const updateSupplier = async (req: Request, res: Response) => {
  try {
    const supplierId = normalizeParam(req.params.id);
    if (!supplierId) {
      return res.status(400).json({ message: 'Supplier ID is required' });
    }
    const supplier = await supplierService.updateById(supplierId, req.body);
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }
    return res.status(200).json({ message: 'Supplier updated', supplier });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to update supplier', error });
  }
};

export const deleteSupplier = async (req: Request, res: Response) => {
  try {
    const supplierId = normalizeParam(req.params.id);
    if (!supplierId) {
      return res.status(400).json({ message: 'Supplier ID is required' });
    }
    const supplier = await supplierService.deleteById(supplierId);
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }
    return res.status(200).json({ message: 'Supplier deleted' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to delete supplier', error });
  }
};
