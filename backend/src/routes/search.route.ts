import { Router } from 'express';
import {
  searchProductsController,
  getFiltersController,
  getSuggestionsController
} from '../controllers/search.controller';

const router = Router();

/**
 * @route   GET /api/search
 * @desc    Search products with filters
 * @access  Public
 * @query   q, category, minPrice, maxPrice, brand, color, size, sort, page, limit
 */
router.get('/', searchProductsController);

/**
 * @route   GET /api/search/filters
 * @desc    Get available filter options based on current search/category
 * @access  Public
 * @query   q, category
 */
router.get('/filters', getFiltersController);

/**
 * @route   GET /api/search/suggestions
 * @desc    Get search suggestions for autocomplete
 * @access  Public
 * @query   q
 */
router.get('/suggestions', getSuggestionsController);

export default router;