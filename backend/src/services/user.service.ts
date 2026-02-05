import User, { IUser } from '../models/User';

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

export const updateUser = async (id: string, userData: Partial<IUser>) => {
  return User.findByIdAndUpdate(id, userData, { new: true }).select('-password');
};

export const deleteUser = async (id: string) => {
  return User.findByIdAndDelete(id);
};