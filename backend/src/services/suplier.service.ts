import Supplier, { ISupplier } from '../models/Supplier';

export type SupplierPayload = Pick<ISupplier, 'name' | 'description'>;

export const getAllSuppliers = async () => {
  return Supplier.find().select('_id name description created_at').sort({ name: 1 });
};

export const getSupplierById = async (id: string) => {
  return Supplier.findById(id);
};

export const createSupplier = async (payload: SupplierPayload) => {
  return Supplier.create(payload);
};

export const updateSupplierById = async (id: string, payload: Partial<SupplierPayload>) => {
  return Supplier.findByIdAndUpdate(id, payload, { new: true });
};

export const deleteSupplierById = async (id: string) => {
  return Supplier.findByIdAndDelete(id);
};
