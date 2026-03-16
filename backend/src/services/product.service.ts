// backend/src/services/product.service.ts
import Product, { IProduct } from '../models/Product';
import { PaginationParams, PaginationResult, buildPaginationResult } from '../utils/pagination';

const createProduct = async (payload: Partial<IProduct>) => {
  return Product.create(payload);
};

//list all products(not limit anymore)
const getAllProductsWithoutPagination = async () => {
  return Product.find().populate('categoryId', 'name').populate('supplierId', 'name');
};

const getProducts = async (params: PaginationParams): Promise<PaginationResult<IProduct>> => {
  const total = await Product.countDocuments();
  const page = params.page ?? 1;
  const limit = params.limit === -1 || params.limit === 0 ? total : (params.limit ?? 10);
  const sort = params.sort ?? 'created_at';
  const order = params.order ?? 'desc';

  const skip = (page - 1) * limit;
  const sortOrder = order === 'asc' ? 1 : -1;

  const data = await Product.find()
    .sort({ [sort]: sortOrder } as any)
    .skip(skip)
    .limit(limit)
    .populate('categoryId', 'name')
    .populate('supplierId', 'name');

  return buildPaginationResult(data, total, page, limit);
};

const getFeaturedProducts = async (params: PaginationParams): Promise<PaginationResult<IProduct>> => {
  const page = params.page ?? 1;
  const limit = params.limit ?? 10;
  const sort = params.sort ?? 'created_at';
  const order = params.order ?? 'desc';

  const skip = (page - 1) * limit;
  const sortOrder = order === 'asc' ? 1 : -1;

  const total = await Product.countDocuments();

  const data = await Product.find()
    .sort({ [sort]: sortOrder } as any)
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
  getAllProductsWithoutPagination,
  getFeaturedProducts,
  getProductById,
  updateProductById,
  deleteProductById,
};