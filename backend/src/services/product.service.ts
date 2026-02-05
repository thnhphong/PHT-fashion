import Product, { IProduct } from '../models/Product';

const createProduct = async (payload: Partial<IProduct>) => {
  return Product.create(payload);
};

const getProducts = async () => {
  return Product.find().sort({ created_at: -1 });
};

const getProductById = async (id: string) => {
  return Product.findById(id);
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
  getProductById,
  updateProductById,
  deleteProductById,
};

