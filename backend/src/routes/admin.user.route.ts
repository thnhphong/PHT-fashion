import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import {
  getAllUsersAdmin,
  getUserByIdAdmin,
  updateUserAdmin,
  deleteUserAdmin,
} from '../controllers/admin.user.controller';
import { validateMongoId } from '../validations/param.validation';

const router = Router();

router.use(authenticate, authorize(['admin']));

router.get('/', getAllUsersAdmin);
router.get('/:id', validateMongoId, getUserByIdAdmin);
router.put('/:id', validateMongoId, updateUserAdmin);
router.delete('/:id', validateMongoId, deleteUserAdmin);

export default router;
