import { Router } from 'express';
import {
  createSupplier,
  deleteSupplier,
  getAllSuppliers,
  getSupplierById,
  updateSupplier,
} from '../controllers/supplier.controller';

const router = Router();

router.post('/', createSupplier);
router.get('/', getAllSuppliers);
router.get('/:id', getSupplierById);
router.put('/:id', updateSupplier);
router.delete('/:id', deleteSupplier);

export default router;
