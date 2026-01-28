import Supplier from '../models/Supplier';

export const getAll = async () => {
  return Supplier.find().select('_id name').sort({ name: 1 });
};
