// backend/src/services/product.service.ts
import Product, { IProduct } from '../models/Product';
import { PaginationParams, PaginationResult, buildPaginationResult } from '../utils/pagination';

const createProduct = async (payload: Partial<IProduct>) => {
  return Product.create(payload);
};

const getProducts = async (params: PaginationParams): Promise<PaginationResult<IProduct>> => {
  const { page, limit, sort, order } = params;

  const skip = (page - 1) * limit;
  const sortOrder = order === 'asc' ? 1 : -1;

  // Get total count
  const total = await Product.countDocuments();

  // Get paginated data
  const data = await Product.find()
    .sort({ [sort]: sortOrder })
    .skip(skip)
    .limit(limit)
    .populate('categoryId', 'name')
    .populate('supplierId', 'name');

  return buildPaginationResult(data, total, page, limit);
};

const getFeaturedProducts = async (params: PaginationParams): Promise<PaginationResult<IProduct>> => {
  const { page, limit, sort, order } = params;

  const skip = (page - 1) * limit;
  const sortOrder = order === 'asc' ? 1 : -1;

  // Get total count of featured products (you can add a 'featured' field to schema later)
  const total = await Product.countDocuments();

  // Get paginated featured products
  const data = await Product.find()
    .sort({ [sort]: sortOrder })
    .skip(skip)
    .limit(limit)
    .populate('categoryId', 'name')
    .populate('supplierId', 'name');

  return buildPaginationResult(data, total, page, limit);
};

const getProductById = async (id: string) => {
  return Product.findById(id)
    .populate('categoryId', 'name')
    .populate('supplierId', 'name');
};

const updateProductById = async (id: string, payload: Partial<IProduct>) => {
  return Product.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
};

const deleteProductById = async (id: string) => {
  return Product.findByIdAndDelete(id);
};

export default {
  createProduct,
  getProducts,
  getFeaturedProducts,
  getProductById,
  updateProductById,
  deleteProductById,
};