"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const search_controller_1 = require("../controllers/search.controller");
const router = (0, express_1.Router)();
/**
 * @route   GET /api/search
 * @desc    Search products with filters
 * @access  Public
 * @query   q, category, minPrice, maxPrice, brand, color, size, sort, page, limit
 */
router.get('/', search_controller_1.searchProductsController);
/**
 * @route   GET /api/search/filters
 * @desc    Get available filter options based on current search/category
 * @access  Public
 * @query   q, category
 */
router.get('/filters', search_controller_1.getFiltersController);
/**
 * @route   GET /api/search/suggestions
 * @desc    Get search suggestions for autocomplete
 * @access  Public
 * @query   q
 */
router.get('/suggestions', search_controller_1.getSuggestionsController);
exports.default = router;
