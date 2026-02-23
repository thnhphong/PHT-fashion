import { Router } from 'express';
import {
  createSupplier,
  deleteSupplier,
  getAllSuppliers,
  getSupplierById,
  updateSupplier,
} from '../controllers/supplier.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireAdminEmail } from '../middlewares/role.middleware';

const router = Router();

router.post('/', authenticate, requireAdminEmail, createSupplier);
router.get('/', getAllSuppliers);
router.get('/:id', getSupplierById);
router.put('/:id', authenticate, requireAdminEmail, updateSupplier);
router.delete('/:id', authenticate, requireAdminEmail, deleteSupplier);

export default router;
