import Supplier, { ISupplier } from '../models/Supplier';

export type SupplierPayload = Pick<ISupplier, 'name' | 'description'>;

export const getAll = async () => {
  return Supplier.find().select('_id name description created_at').sort({ name: 1 });
};

export const getById = async (id: string) => {
  return Supplier.findById(id);
};

export const create = async (payload: SupplierPayload) => {
  return Supplier.create(payload);
};

export const updateById = async (id: string, payload: Partial<SupplierPayload>) => {
  return Supplier.findByIdAndUpdate(id, payload, { new: true });
};

export const deleteById = async (id: string) => {
  return Supplier.findByIdAndDelete(id);
};
