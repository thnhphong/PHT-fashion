"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSuggestionsController = exports.getFiltersController = exports.searchProductsController = void 0;
const api_error_1 = require("../utils/api-error");
const search_service_1 = require("../services/search.service");
const searchProductsController = async (req, res) => {
    try {
        const { q, category, minPrice, maxPrice, supplier, //supplier filter
        color, size, sort, page = 1, limit = 20 } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
            throw new api_error_1.ApiError(400, 'Invalid page or limit');
        }
        const filters = {
            searchQuery: q || '',
            category: category,
            minPrice: minPrice ? parseFloat(minPrice) : undefined,
            maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
            supplier: supplier,
            color: color,
            size: size,
            sort: sort || 'relevance',
            page: pageNum,
            limit: limitNum
        };
        const results = await (0, search_service_1.searchProducts)(filters);
        return res.status(200).json({
            success: true,
            data: results.products,
            pagination: {
                currentPage: pageNum,
                totalPages: results.totalPages,
                totalProducts: results.totalProducts,
                hasNext: pageNum < results.totalPages,
                hasPrev: pageNum > 1,
                limit: limitNum
            },
            filters: results.appliedFilters,
            message: `Found ${results.totalProducts} products matching your search`
        });
    }
    catch (error) {
        if (error instanceof api_error_1.ApiError) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }
        console.error('Search error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error during search'
        });
    }
};
exports.searchProductsController = searchProductsController;
const getFiltersController = async (req, res) => {
    try {
        const { q, category, supplier, color, size } = req.query;
        const filterOptions = await (0, search_service_1.getFilterOptions)({
            searchQuery: q,
            category: category,
            supplier: supplier,
            color: color,
            size: size
        });
        return res.status(200).json({
            success: true,
            data: filterOptions,
            message: 'Filter options retrieved successfully'
        });
    }
    catch (error) {
        if (error instanceof api_error_1.ApiError) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }
        console.error('Get filters error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getFiltersController = getFiltersController;
const getSuggestionsController = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.length < 2) {
            return res.status(200).json({
                success: true,
                data: [],
                message: 'Query too short'
            });
        }
        const suggestions = await (0, search_service_1.searchProducts)({
            searchQuery: q,
            limit: 5,
            page: 1
        });
        const suggestionList = suggestions.products.map((p) => ({
            name: p.name,
            category: p.categoryId,
            price: p.price
        }));
        return res.status(200).json({
            success: true,
            data: suggestionList,
            message: 'Suggestions retrieved successfully'
        });
    }
    catch (error) {
        console.error('Suggestions error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getSuggestionsController = getSuggestionsController;
