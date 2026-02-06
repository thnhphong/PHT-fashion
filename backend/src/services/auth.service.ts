import { IUser } from '../models/User';
import { signAccessToken, signRefreshToken, signResetPasswordToken, verifyToken } from '../config/jwt';
import { findUserByEmail, updateUser, findUserByIdWithPassword } from './user.service';
import bcrypt from 'bcryptjs';

export const loginUser = (user: IUser) => {
  const payload = {
    sub: user._id.toString(),
    role: user.role,
  };

  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  return { accessToken, refreshToken };
};

export const refreshUserToken = (refreshToken: string) => {
  try {
    const payload = verifyToken(refreshToken);

    // Create new Access Token
    const newAccessToken = signAccessToken({
      sub: payload.sub,
      role: payload.role,
    });

    return newAccessToken;
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
};

export const forgotPassword = async (email: string) => {
  const user = await findUserByEmail(email);
  if (!user) {
    throw new Error('User not found');
  }

  const payload = {
    sub: user._id.toString(),
    role: user.role,
  };

  const resetToken = signResetPasswordToken(payload);
  return resetToken;
};

export const resetPassword = async (token: string, newPassword: string) => {
  try {
    const payload = verifyToken(token);
    const userId = payload.sub;

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await updateUser(userId, { password: hashedPassword });

    return true;
  } catch (error) {
    throw new Error('Invalid or expired reset token');
  }
};


export const changePassword = async (userId: string, oldPassword: string, newPassword: string) => {
  // We need to fetch user with password to verify
  const user = await findUserByIdWithPassword(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) {
    throw new Error('Incorrect old password');
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await updateUser(userId, { password: hashedPassword });

  return true;
};