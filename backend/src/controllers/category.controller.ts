import type { Request, Response } from 'express';
import { Types } from 'mongoose';
import { ICategory } from '../models/Category';
import categoryService from '../services/category.service';

const normalizeField = (value: string | string[] | undefined): string | undefined => {
  if (!value) return undefined;
  return Array.isArray(value) ? value[0] : value;
};

const castToObjectId = (value: string | string[] | undefined): Types.ObjectId | undefined => {
  const normalized = normalizeField(value);
  if (!normalized) return undefined;
  return new Types.ObjectId(normalized);
};

const createCategory = async (req: Request, res: Response) => {
  try {
    const name = normalizeField(req.body.name);
    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }
    const category = await categoryService.createCategory({ name });
    return res.status(201).json({ message: 'Category created', category });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to create category', error });
  }
}

const getCategories = async (_req: Request, res: Response) => {
  try {
    const categories = await categoryService.getCategories();
    return res.json(categories);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to fetch categories', error });
  }
}

const getCategoryById = async (req: Request, res: Response) => {
  try {
    const category = await categoryService.getCategoryById(String(req.params.id));
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    return res.json(category)
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to fetch category by id', error });
  }
}

const updateCategory = async (req: Request, res: Response) => {
  try {
    const updatePayload: Partial<Record<string, unknown>> = { ...req.body };
    const categoryId = castToObjectId(req.params.id);
    if (!categoryId) {
      return res.status(400).json({ message: 'Category ID is required' });
    }
    const category = await categoryService.updateCategoryById(categoryId.toString(), updatePayload);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    return res.json({ message: 'Category updated', category });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to update category', error });
  }
}

const deleteCategory = async (req: Request, res: Response) => {
  try {
    const categoryId = castToObjectId(req.params.id);
    if (!categoryId) {
      return res.status(400).json({ message: 'Category ID is required' });
    }
    const category = await categoryService.deleteCategoryById(categoryId.toString());
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    return res.json({ message: 'Category deleted', category });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to delete category by id', error });
  }
}

export { createCategory, getCategories, getCategoryById, updateCategory, deleteCategory };