import { Router } from 'express';
import { getAllSuppliers } from '../controllers/supplier.controller';

const router = Router();

router.get('/', getAllSuppliers);

export default router;
