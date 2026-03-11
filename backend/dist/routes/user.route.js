"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const validateRequest_1 = require("../middlewares/validateRequest");
const validateParams_1 = require("../middlewares/validateParams");
const auth_validation_1 = require("../validations/auth.validation");
const param_validation_1 = require("../validations/param.validation");
const router = (0, express_1.Router)();
// POST /api/users/register - Register a new user
router.post('/register', (0, validateRequest_1.validateRequest)(auth_validation_1.registerSchema), user_controller_1.registerUser);
// GET /api/users - Get all users
router.get('/', user_controller_1.getUsers);
// GET /api/users/:id - Get user by ID
router.get('/:id', param_validation_1.validateMongoId, validateParams_1.validateParams, user_controller_1.getUser);
// PUT /api/users/:id - Update user by ID
router.put('/:id', param_validation_1.validateMongoId, validateParams_1.validateParams, user_controller_1.updateUserById);
// DELETE /api/users/:id - Delete user by ID
router.delete('/:id', param_validation_1.validateMongoId, validateParams_1.validateParams, user_controller_1.deleteUserById);
exports.default = router;
