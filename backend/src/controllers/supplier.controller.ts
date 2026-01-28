import { Request, Response } from 'express';
import * as supplierService from '../services/suplier.service';

export const getAllSuppliers = async (_req: Request, res: Response) => {
  const suppliers = await supplierService.getAll();
  res.status(200).json(suppliers);
};
