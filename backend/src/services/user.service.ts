import User, { IUser } from '../models/User';

export const createUser = async (userData: Partial<IUser>) => {
  const newUser = new User(userData);
  await newUser.save();
  console.log(newUser)
  return newUser;
}

export const findUserByEmail = async (email: string) => {
  return User.findOne({ email });
}
