import { Request, Response } from 'express';
import * as categoryService from '../services/category.service';

export const getAllCategories = async (_req: Request, res: Response) => {
  const categories = await categoryService.getAll();
  res.status(200).json(categories);
};
