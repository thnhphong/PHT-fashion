import { IUser } from '../models/User';
import { signAuthToken } from '../config/jwt';

export const loginUser = (user: IUser): string => {
  const token = signAuthToken({
    sub: user._id.toString(),
    role: user.role,
  });

  return token;
};

export const verifyToken = (token: string) => {
  // This will be implemented later for middleware
  // For now, just return the verification from jwt config
  const { verifyAuthToken } = require('../config/jwt');
  return verifyAuthToken(token);
};