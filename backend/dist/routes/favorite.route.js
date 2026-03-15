"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const favorite_controller_1 = require("../controllers/favorite.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const validateRequest_1 = require("../middlewares/validateRequest");
const favorite_validation_1 = require("../validations/favorite.validation");
const router = (0, express_1.Router)();
// GET /api/favorites — get user's favorites
router.get('/', auth_middleware_1.authenticate, favorite_controller_1.getFavorites);
// POST /api/favorites/merge — merge guest favorites into DB (must be before /:productId)
router.post('/merge', auth_middleware_1.authenticate, (0, validateRequest_1.validateRequest)(favorite_validation_1.mergeFavoritesSchema), favorite_controller_1.mergeFavorites);
// POST /api/favorites/:productId — add product to favorites
router.post('/:productId', auth_middleware_1.authenticate, favorite_controller_1.addFavorite);
// DELETE /api/favorites/:productId — remove product from favorites
router.delete('/:productId', auth_middleware_1.authenticate, favorite_controller_1.removeFavorite);
exports.default = router;
