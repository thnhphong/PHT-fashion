import { Router } from 'express';
import { register, login, refreshToken } from '../controllers/auth.controller';
import { validateRequest } from '../middlewares/validateRequest';
import { registerSchema, loginSchema } from '../validations/auth.validation';

const router = Router();

// POST /api/auth/register
router.post('/register', validateRequest(registerSchema), register);

// POST /api/auth/login
router.post('/login', validateRequest(loginSchema), login);

// POST /api/auth/refresh-token
router.post('/refresh-token', refreshToken);

export default router;