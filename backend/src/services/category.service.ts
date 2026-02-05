import Category, { ICategory } from '../models/Category';


const createCategory = async (payload: Partial<ICategory>) => {
  return Category.create(payload);
};

const getCategories = async () => {
  return Category.find().select('_id name').sort({ name: 1 });
};

const getCategoryById = async (id: string) => {
  return Category.findById(id).select('_id name');
};

const updateCategoryById = async (id: string, payload: Partial<ICategory>) => {
  return Category.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
}

const deleteCategoryById = async (id: string) => {
  return Category.findByIdAndDelete(id);
};

export default {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategoryById,
  deleteCategoryById,
};

