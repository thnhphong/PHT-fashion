import { Router } from 'express';
import multer from 'multer';
import {
  createProduct,
  deleteProduct,
  getProductById,
  getProducts,
  getFeaturedProducts,
  updateProduct,
  getBestSellers,
} from '../controllers/product.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireAdminEmail } from '../middlewares/role.middleware';

const storage = multer.diskStorage({});
const upload = multer({ storage });

const router = Router();

const imageFields = [
  { name: 'img_url', maxCount: 1 },
  { name: 'thumbnail_img_1', maxCount: 1 },
  { name: 'thumbnail_img_2', maxCount: 1 },
  { name: 'thumbnail_img_3', maxCount: 1 },
  { name: 'thumbnail_img_4', maxCount: 1 },
];

// Public routes
router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/best-sellers', getBestSellers);
router.get('/:id', getProductById);

// Admin routes (should be protected with auth middleware later)
router.post('/', authenticate, requireAdminEmail, upload.fields(imageFields), createProduct);
router.put('/:id', authenticate, requireAdminEmail, upload.fields(imageFields), updateProduct);
router.delete('/:id', authenticate, requireAdminEmail, deleteProduct);

export default router;