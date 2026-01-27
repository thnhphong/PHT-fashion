import { Router } from 'express';
import {
  registerUser,
  getUser,
  getUsers,
  updateUserById,
  deleteUserById
} from '../controllers/user.controller';

const router = Router();

// POST /api/users/register - Register a new user
router.post('/register', registerUser);

// GET /api/users - Get all users
router.get('/', getUsers);

// GET /api/users/:id - Get user by ID
router.get('/:id', getUser);

// PUT /api/users/:id - Update user by ID
router.put('/:id', updateUserById);

// DELETE /api/users/:id - Delete user by ID
router.delete('/:id', deleteUserById);

export default router;