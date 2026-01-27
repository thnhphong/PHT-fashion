import { JwtPayload, Secret, sign, verify, SignOptions } from 'jsonwebtoken';

import { env } from './env';

export interface AuthTokenPayload extends JwtPayload {
  sub: string;
  role: string;
}

const jwtSecret: Secret = env.jwtSecret;
const jwtOptions: SignOptions = {
  expiresIn: env.jwtExpires as SignOptions['expiresIn'],
};

export const signAuthToken = (payload: AuthTokenPayload): string => {
  return sign(payload, jwtSecret, jwtOptions);
};

export const verifyAuthToken = (token: string): AuthTokenPayload => {
  return verify(token, jwtSecret) as AuthTokenPayload;
};

