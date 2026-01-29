import { Router } from 'express';
import { register, login, refreshToken, forgotPassword, changePassword, resetPassword } from '../controllers/auth.controller';
import { validateRequest } from '../middlewares/validateRequest';
import { authenticate } from '../middlewares/auth.middleware';
import { registerSchema, loginSchema, forgotPasswordSchema, changePasswordSchema, resetPasswordSchema } from '../validations/auth.validation';

const router = Router();

// POST /api/auth/register
router.post('/register', validateRequest(registerSchema), register);

// POST /api/auth/login
router.post('/login', validateRequest(loginSchema), login);

// POST /api/auth/refresh-token
router.post('/refresh-token', refreshToken);

// POST /api/auth/forgot-password
router.post('/forgot-password', validateRequest(forgotPasswordSchema), forgotPassword);

// POST /api/auth/reset-password
router.post('/reset-password', validateRequest(resetPasswordSchema), resetPassword);

// POST /api/auth/change-password
router.post('/change-password', authenticate, validateRequest(changePasswordSchema), changePassword);

export default router;