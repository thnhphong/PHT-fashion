import { Router } from 'express';
import multer from 'multer';
import {
  createProduct,
  deleteProduct,
  getProductById,
  getProducts,
  updateProduct,
} from '../controllers/product.controller';

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

router.post('/', upload.fields(imageFields), createProduct);
router.get('/', getProducts);
router.get('/:id', getProductById);
router.put('/:id', upload.fields(imageFields), updateProduct);
router.delete('/:id', deleteProduct);

export default router;

