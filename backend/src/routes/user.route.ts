import { Router } from 'express';
import {
  registerUser,
  getUser,
  getUsers,
  updateUserById,
  deleteUserById
} from '../controllers/user.controller';

import { validateRequest } from '../middlewares/validateRequest';
import { validateParams } from '../middlewares/validateParams';
import { registerSchema } from '../validations/auth.validation';

import { validateMongoId } from '../validations/param.validation';

const router = Router();

// POST /api/users/register - Register a new user
router.post('/register', validateRequest(registerSchema), registerUser);

// GET /api/users - Get all users
router.get('/', getUsers);

// GET /api/users/:id - Get user by ID
router.get('/:id', validateMongoId, validateParams, getUser);

// PUT /api/users/:id - Update user by ID
router.put('/:id', validateMongoId, validateParams, updateUserById);

// DELETE /api/users/:id - Delete user by ID
router.delete('/:id', validateMongoId, validateParams, deleteUserById);

export default router;