import type { Request, Response } from 'express';
import { Types } from 'mongoose';
import { IProduct } from '../models/Product';
import productService from '../services/product.service';
import { uploadImage } from '../config/cloudinary';

type UploadedFile = { path: string };
type UploadedFileRecord = Record<string, UploadedFile[]>;

const imageFields = ['img_url', 'thumbnail_img_1', 'thumbnail_img_2', 'thumbnail_img_3', 'thumbnail_img_4'] as const;

const uploadFirstFile = async (
  files: UploadedFileRecord | undefined,
  field: string
): Promise<string | undefined> => {
  if (!files) return undefined;
  const match = files[field];
  if (!match || match.length === 0) return undefined;
  const file = match[0];
  const uploaded = await uploadImage(file.path);
  return uploaded.secure_url || uploaded.url;
};

const buildImagePayload = async (files: UploadedFileRecord | undefined) => {
  const payload: Partial<Record<typeof imageFields[number], string>> = {};
  for (const field of imageFields) {
    const url = await uploadFirstFile(files, field);
    if (url) {
      payload[field] = url;
    }
  }
  return payload;
};

const normalizeField = (value: string | string[] | undefined): string | undefined => {
  if (!value) return undefined;
  return Array.isArray(value) ? value[0] : value;
};

const castToObjectId = (value: string | string[] | undefined): Types.ObjectId | undefined => {
  const normalized = normalizeField(value);
  if (!normalized) return undefined;
  return new Types.ObjectId(normalized);
};

const createProduct = async (req: Request, res: Response) => {
  try {
    const name = normalizeField(req.body.name);
    const description = normalizeField(req.body.description);
    const price = normalizeField(req.body.price);
    const categoryId = normalizeField(req.body.categoryId);
    const supplierId = normalizeField(req.body.supplierId);
    const stock = normalizeField(req.body.stock);
    const sizes = normalizeField(req.body.sizes);
    const files = req.files as UploadedFileRecord | undefined;
    const productImages = await buildImagePayload(files);
    const product = await productService.createProduct({
      name,
      description,
      price: Number(price),
      categoryId: castToObjectId(categoryId),
      supplierId: castToObjectId(supplierId),
      stock: Number(stock),
      sizes: sizes ? JSON.parse(sizes) : undefined,
      ...productImages,
    });

    return res.status(201).json({ message: 'Product created', product });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to create product', error });
  }
};

const getProducts = async (_req: Request, res: Response) => {
  try {
    const products = await productService.getProducts();
    return res.json(products);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to fetch products', error });
  }
};

const getProductById = async (req: Request, res: Response) => {
  try {
    const product = await productService.getProductById(String(req.params.id));
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    return res.json(product);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to fetch product', error });
  }
};

const updateProduct = async (req: Request, res: Response) => {
  try {
    const updatePayload: Partial<Record<string, unknown>> = { ...req.body };
    const categoriesField = castToObjectId(req.body.categoryId);
    if (categoriesField) {
      updatePayload.categoryId = categoriesField;
    }
    const supplierField = castToObjectId(req.body.supplierId);
    if (supplierField) {
      updatePayload.supplierId = supplierField;
    }
    const sizesField = normalizeField(req.body.sizes);
    if (sizesField) {
      updatePayload.sizes = JSON.parse(sizesField);
    }
    if (updatePayload.price && typeof updatePayload.price !== 'string') {
      updatePayload.price = Array.isArray(updatePayload.price) ? updatePayload.price[0] : updatePayload.price;
    }
    if (updatePayload.stock && typeof updatePayload.stock !== 'string') {
      updatePayload.stock = Array.isArray(updatePayload.stock) ? updatePayload.stock[0] : updatePayload.stock;
    }
    if (updatePayload.price) updatePayload.price = Number(updatePayload.price);
    if (updatePayload.stock) updatePayload.stock = Number(updatePayload.stock);

    const files = req.files as UploadedFileRecord | undefined;
    const imageUpdates = await buildImagePayload(files);
    const payloadToUpdate = { ...updatePayload, ...imageUpdates } as Partial<IProduct>;
    const product = await productService.updateProductById(String(req.params.id), payloadToUpdate);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    return res.json({ message: 'Product updated', product });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to update product', error });
  }
};

const deleteProduct = async (req: Request, res: Response) => {
  try {
    const deleted = await productService.deleteProductById(String(req.params.id));
    if (!deleted) {
      return res.status(404).json({ message: 'Product not found' });
    }
    return res.json({ message: 'Product deleted' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to delete product', error });
  }
};

export { createProduct, getProducts, getProductById, updateProduct, deleteProduct };

