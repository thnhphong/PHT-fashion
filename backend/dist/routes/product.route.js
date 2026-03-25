"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const product_controller_1 = require("../controllers/product.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const role_middleware_1 = require("../middlewares/role.middleware");
const storage = multer_1.default.diskStorage({});
const upload = (0, multer_1.default)({ storage });
const router = (0, express_1.Router)();
const imageFields = [
    { name: 'img_url', maxCount: 1 },
    { name: 'thumbnail_img_1', maxCount: 1 },
    { name: 'thumbnail_img_2', maxCount: 1 },
    { name: 'thumbnail_img_3', maxCount: 1 },
    { name: 'thumbnail_img_4', maxCount: 1 },
];
// Public routes
router.get('/', product_controller_1.getProducts);
router.get('/featured', product_controller_1.getFeaturedProducts);
router.get('/best-sellers', product_controller_1.getBestSellers);
router.get('/:id', product_controller_1.getProductById);
// Admin routes (should be protected with auth middleware later)
router.post('/', auth_middleware_1.authenticate, role_middleware_1.requireAdminEmail, upload.fields(imageFields), product_controller_1.createProduct);
router.put('/:id', auth_middleware_1.authenticate, role_middleware_1.requireAdminEmail, upload.fields(imageFields), product_controller_1.updateProduct);
router.delete('/:id', auth_middleware_1.authenticate, role_middleware_1.requireAdminEmail, product_controller_1.deleteProduct);
exports.default = router;
