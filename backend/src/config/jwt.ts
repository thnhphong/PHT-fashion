import { JwtPayload, Secret, sign, verify, SignOptions } from 'jsonwebtoken';
import { env } from './env';

export interface AuthTokenPayload extends JwtPayload {
  sub: string;
  role: string;
}

const jwtSecret: Secret = env.jwtSecret;

// Access Token: 15 minutes
const accessTokenOptions: SignOptions = {
  expiresIn: '15m',
};

// Refresh Token: 7 days
const refreshTokenOptions: SignOptions = {
  expiresIn: '7d',
};

export const signAccessToken = (payload: AuthTokenPayload): string => {
  return sign(payload, jwtSecret, accessTokenOptions);
};

export const signRefreshToken = (payload: AuthTokenPayload): string => {
  return sign(payload, jwtSecret, refreshTokenOptions);
};

// Reset Password Token: 10 minutes
const resetPasswordOptions: SignOptions = {
  expiresIn: '10m',
};

export const signResetPasswordToken = (payload: AuthTokenPayload): string => {
  return sign(payload, jwtSecret, resetPasswordOptions);
};

export const verifyToken = (token: string): AuthTokenPayload => {
  return verify(token, jwtSecret) as AuthTokenPayload;
};

// Kept for backward compatibility if needed, but aliased to signAccessToken
export const signAuthToken = signAccessToken;
export const verifyAuthToken = verifyToken;


