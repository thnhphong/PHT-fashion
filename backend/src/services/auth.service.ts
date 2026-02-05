import { IUser } from '../models/User';
import { signAccessToken, signRefreshToken, verifyToken } from '../config/jwt';

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
