// backend/src/services/product.service.ts
import Product, { IProduct } from '../models/Product';
import Order from '../models/Order';
import OrderItem from '../models/OrderItem';
import { PaginationParams, PaginationResult, buildPaginationResult } from '../utils/pagination';

const createProduct = async (payload: Partial<IProduct>) => {
  return Product.create(payload);
};

const getProducts = async (params: PaginationParams): Promise<PaginationResult<IProduct>> => {
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

const getBestSellers = async (params: PaginationParams): Promise<PaginationResult<IProduct>> => {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  const sort = params.sort ?? 'relevance';
  const order = params.order ?? 'desc';

  const skip = (page - 1) * limit;

  const orderStatusFilter = { status: { $ne: 'cancelled' } };

  const bestSellerData = await OrderItem.aggregate([
    {
      $lookup: {
        from: 'orders',
        localField: 'orderId',
        foreignField: '_id',
        as: 'order'
      }
    },
    { $unwind: '$order' },
    { $match: orderStatusFilter },
    {
      $group: {
        _id: '$productId',
        totalSold: { $sum: '$quantity' }
      }
    },
    { $sort: { totalSold: -1 } },
    { $skip: skip },
    { $limit: limit }
  ]);

  if (bestSellerData.length === 0) {
    return buildPaginationResult([], 0, page, limit);
  }

  const productIds = bestSellerData.map((item: any) => item._id);
  const productMap = new Map(bestSellerData.map((item: any) => [item._id.toString(), item.totalSold]));

  let sortOptions = {};
  if (sort === 'price-asc') sortOptions = { price: 1 };
  else if (sort === 'price-desc') sortOptions = { price: -1 };
  else sortOptions = { created_at: -1 };

  const products = await Product.find({ _id: { $in: productIds } })
    .sort(sortOptions as any)
    .populate('categoryId', 'name')
    .populate('supplierId', 'name')
    .lean();

  const sortedProducts = productIds.map((id: any) => {
    const product = products.find(p => p._id.toString() === id.toString());
    if (product) {
      return { ...product, totalSold: productMap.get(id.toString()) };
    }
    return null;
  }).filter(Boolean);

  const totalItems = await OrderItem.aggregate([
    {
      $lookup: {
        from: 'orders',
        localField: 'orderId',
        foreignField: '_id',
        as: 'order'
      }
    },
    { $unwind: '$order' },
    { $match: orderStatusFilter },
    {
      $group: {
        _id: '$productId'
      }
    },
    { $count: 'total' }
  ]);

  const total = totalItems[0]?.total || 0;

  return buildPaginationResult(sortedProducts as unknown as IProduct[], total, page, limit);
};

export default {
  createProduct,
  getProducts,
  getFeaturedProducts,
  getProductById,
  updateProductById,
  deleteProductById,
  getBestSellers,
};