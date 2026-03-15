"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cart_controller_1 = require("../controllers/cart.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const validateRequest_1 = require("../middlewares/validateRequest");
const cart_validation_1 = require("../validations/cart.validation");
const router = (0, express_1.Router)();
// GET /api/cart — get user's cart
router.get('/', auth_middleware_1.authenticate, cart_controller_1.getCart);
// POST /api/cart/items — add item to cart
router.post('/items', auth_middleware_1.authenticate, (0, validateRequest_1.validateRequest)(cart_validation_1.addCartItemSchema), cart_controller_1.addItem);
// PATCH /api/cart/items/:productId — update item quantity
router.patch('/items/:productId', auth_middleware_1.authenticate, (0, validateRequest_1.validateRequest)(cart_validation_1.updateCartItemSchema), cart_controller_1.updateItem);
// DELETE /api/cart/items/:productId — remove item from cart
router.delete('/items/:productId', auth_middleware_1.authenticate, (0, validateRequest_1.validateRequest)(cart_validation_1.removeCartItemSchema), cart_controller_1.removeItem);
// DELETE /api/cart — clear cart
router.delete('/', auth_middleware_1.authenticate, cart_controller_1.clearCart);
// POST /api/cart/merge — merge guest cart into DB cart
router.post('/merge', auth_middleware_1.authenticate, (0, validateRequest_1.validateRequest)(cart_validation_1.mergeCartSchema), cart_controller_1.mergeCart);
exports.default = router;
