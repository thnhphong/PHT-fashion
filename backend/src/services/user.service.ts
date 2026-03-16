import User, { IUser } from '../models/User';
import Order from '../models/Order';

export const createUser = async (userData: Partial<IUser>) => {
  const newUser = new User(userData);
  await newUser.save();
  return newUser;
};

export const findUserByEmail = async (email: string) => {
  return User.findOne({ email });
};

export const findUserById = async (id: string) => {
  return User.findById(id).select('-password');
};

export const findUserByIdWithPassword = async (id: string) => {
  return User.findById(id);
};

export const getAllUsers = async () => {
  return User.find().select('-password');
};

export const getAllUsersWithStats = async () => {
  const users = await User.find({ role: 'customer' }).select('-password').lean();
  const userIds = users.map(u => u._id);
  
  const orderStats = await Order.aggregate([
    { $match: { customerId: { $in: userIds }, status: { $ne: 'cancelled' } } },
    { $group: { _id: '$customerId', totalSpent: { $sum: '$total_amount' } } }
  ]);
  
  const statsMap = Object.fromEntries(orderStats.map(s => [s._id.toString(), s.totalSpent]));
  
  return users.map(u => ({
    ...u,
    totalSpent: statsMap[u._id.toString()] || 0
  }));
};

export const updateUser = async (id: string, userData: Partial<IUser>) => {
  return User.findByIdAndUpdate(id, userData, { new: true }).select('-password');
};

export const deleteUser = async (id: string) => {
  return User.findByIdAndDelete(id);
};