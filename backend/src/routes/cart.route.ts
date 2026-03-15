import { Router } from 'express';
import {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
  mergeCart,
} from '../controllers/cart.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validateRequest';
import {
  addCartItemSchema,
  updateCartItemSchema,
  removeCartItemSchema,
  mergeCartSchema,
} from '../validations/cart.validation';

const router = Router();

// GET /api/cart — get user's cart
router.get('/', authenticate, getCart);

// POST /api/cart/items — add item to cart
router.post('/items', authenticate, validateRequest(addCartItemSchema), addItem);

// PATCH /api/cart/items/:productId — update item quantity
router.patch('/items/:productId', authenticate, validateRequest(updateCartItemSchema), updateItem);

// DELETE /api/cart/items/:productId — remove item from cart
router.delete('/items/:productId', authenticate, validateRequest(removeCartItemSchema), removeItem);

// DELETE /api/cart — clear cart
router.delete('/', authenticate, clearCart);

// POST /api/cart/merge — merge guest cart into DB cart
router.post('/merge', authenticate, validateRequest(mergeCartSchema), mergeCart);

export default router;
