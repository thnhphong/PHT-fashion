import { Router } from 'express';
import { createCategory, getCategoryById, getCategories, updateCategory, deleteCategory } from '../controllers/category.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireAdminEmail } from '../middlewares/role.middleware';

const router = Router();

router.post('/', authenticate, requireAdminEmail, createCategory);
router.get('/', getCategories);
router.get('/:id', getCategoryById);
router.put('/:id', authenticate, requireAdminEmail, updateCategory);
router.delete('/:id', authenticate, requireAdminEmail, deleteCategory);

export default router;