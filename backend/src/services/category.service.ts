import Category from '../models/Category';

export const getAll = async () => {
  return Category.find().select('_id name').sort({ name: 1 });
};
