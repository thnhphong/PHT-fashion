import { Router } from 'express';
import {
  getFavorites,
  addFavorite,
  removeFavorite,
  mergeFavorites,
} from '../controllers/favorite.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validateRequest';
import { mergeFavoritesSchema } from '../validations/favorite.validation';

const router = Router();

// GET /api/favorites — get user's favorites
router.get('/', authenticate, getFavorites);

// POST /api/favorites/:productId — add product to favorites
router.post('/:productId', authenticate, addFavorite);

// DELETE /api/favorites/:productId — remove product from favorites
router.delete('/:productId', authenticate, removeFavorite);

// POST /api/favorites/merge — merge guest favorites into DB
router.post('/merge', authenticate, validateRequest(mergeFavoritesSchema), mergeFavorites);

export default router;
