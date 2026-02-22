import { IUser } from '../models/User';
import { signAccessToken, signRefreshToken, signResetPasswordToken, verifyToken, verifyRefreshToken, REFRESH_TOKEN_EXPIRY_MS } from '../config/jwt';
import { findUserByEmail, updateUser, findUserByIdWithPassword } from './user.service';
import RefreshToken from '../models/RefreshToken';
import bcrypt from 'bcryptjs';

export const loginUser = async (user: IUser) => {
  const payload = {
    sub: user._id.toString(),
    role: user.role,
  };

  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  // Save refresh token to database
  await RefreshToken.create({
    token: refreshToken,
    userId: user._id,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
  });

  return { accessToken, refreshToken };
};

export const refreshUserToken = async (oldRefreshToken: string) => {
  // 1. Verify the token signature
  const payload = verifyRefreshToken(oldRefreshToken);

  // 2. Check if token exists in DB (not revoked)
  const storedToken = await RefreshToken.findOne({ token: oldRefreshToken });
  if (!storedToken) {
    throw new Error('Refresh token has been revoked');
  }

  // 3. Delete the old token (rotation)
  await RefreshToken.deleteOne({ _id: storedToken._id });

  // 4. Create new token pair
  const newPayload = {
    sub: payload.sub,
    role: payload.role,
  };

  const newAccessToken = signAccessToken(newPayload);
  const newRefreshToken = signRefreshToken(newPayload);

  // 5. Save new refresh token to DB
  await RefreshToken.create({
    token: newRefreshToken,
    userId: payload.sub,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
  });

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

export const logoutUser = async (refreshToken: string) => {
  await RefreshToken.deleteOne({ token: refreshToken });
};

export const logoutAllDevices = async (userId: string) => {
  await RefreshToken.deleteMany({ userId });
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