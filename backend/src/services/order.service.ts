import Order, { IOrder } from '../models/Order';

const createOrder = async (payload: Partial<IOrder>) => {
  return Order.create(payload);
};

const getOrders = async () => {
  return Order.find();
};

const getOrderById = async (id: string) => {
  return Order.findById(id);
};

const updateOrderById = async (id: string, payload: Partial<IOrder>) => {
  return Order.findByIdAndUpdate(id, payload, { new: true });
};

const deleteOrderById = async (id: string) => {
  return Order.findByIdAndDelete(id);
};

export default {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderById,
  deleteOrderById,
};