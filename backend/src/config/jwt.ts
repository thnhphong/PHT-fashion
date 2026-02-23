import { JwtPayload, Secret, sign, verify, SignOptions } from 'jsonwebtoken';
import { env } from './env';

export interface AuthTokenPayload extends JwtPayload {
  sub: string;
  role: string;
  email: string;
}

const jwtSecret: Secret = env.jwtSecret;
const refreshTokenSecret: Secret = env.refreshTokenSecret;

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
  return sign(payload, refreshTokenSecret, refreshTokenOptions);
};

// Reset Password Token: 10 minutes
const resetPasswordOptions: SignOptions = {
  expiresIn: '10m',
};

export const signResetPasswordToken = (payload: AuthTokenPayload): string => {
  return sign(payload, jwtSecret, resetPasswordOptions);
};

// Verify access token (uses jwtSecret)
export const verifyToken = (token: string): AuthTokenPayload => {
  return verify(token, jwtSecret) as AuthTokenPayload;
};

// Verify refresh token (uses refreshTokenSecret)
export const verifyRefreshToken = (token: string): AuthTokenPayload => {
  return verify(token, refreshTokenSecret) as AuthTokenPayload;
};

// Refresh token expiry in milliseconds (7 days) — used for cookie maxAge and DB expiresAt
export const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

// Kept for backward compatibility
export const signAuthToken = signAccessToken;
export const verifyAuthToken = verifyToken;
