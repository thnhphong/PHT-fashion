"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const validateRequest_1 = require("../middlewares/validateRequest");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const auth_validation_1 = require("../validations/auth.validation");
const router = (0, express_1.Router)();
// POST /api/auth/register
router.post('/register', (0, validateRequest_1.validateRequest)(auth_validation_1.registerSchema), auth_controller_1.register);
// POST /api/auth/login
router.post('/login', (0, validateRequest_1.validateRequest)(auth_validation_1.loginSchema), auth_controller_1.login);
// POST /api/auth/refresh-token
router.post('/refresh-token', auth_controller_1.refreshToken);
// POST /api/auth/logout
router.post('/logout', auth_controller_1.logout);
// POST /api/auth/forgot-password
router.post('/forgot-password', (0, validateRequest_1.validateRequest)(auth_validation_1.forgotPasswordSchema), auth_controller_1.forgotPassword);
// POST /api/auth/reset-password
router.post('/reset-password', (0, validateRequest_1.validateRequest)(auth_validation_1.resetPasswordSchema), auth_controller_1.resetPassword);
// POST /api/auth/change-password
router.post('/change-password', auth_middleware_1.authenticate, (0, validateRequest_1.validateRequest)(auth_validation_1.changePasswordSchema), auth_controller_1.changePassword);
exports.default = router;
