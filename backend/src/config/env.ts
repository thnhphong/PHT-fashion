import dotenv from 'dotenv';

dotenv.config();

interface RequiredEnv {
  mongoUri: string;
  jwtSecret: string;
  emailUser: string;
  emailPass: string;
}

const ensureEnv = (value: string | undefined, name: string): string => {
  if (!value) {
    throw new Error(`Please set the ${name} environment variable`);
  }
  return value;
};

export const env = {
  mongoUri: ensureEnv(process.env.MONGO_URI, 'MONGO_URI'),
  jwtSecret: ensureEnv(process.env.JWT_SECRET, 'JWT_SECRET'),
  emailUser: ensureEnv(process.env.EMAIL_USER, 'EMAIL_USER'),
  emailPass: ensureEnv(process.env.EMAIL_PASS, 'EMAIL_PASS'),
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || ensureEnv(process.env.JWT_SECRET, 'JWT_SECRET'),
  jwtExpires: process.env.JWT_EXPIRES || '1h',
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  emailHost: process.env.EMAIL_HOST || 'smtp.gmail.com',
  emailPort: Number(process.env.EMAIL_PORT) || 587,
  emailSecure: process.env.EMAIL_SECURE === 'true',
} satisfies
  RequiredEnv & {
    refreshTokenSecret: string;
    jwtExpires: string;
    port: number;
    nodeEnv: string;
    emailHost: string;
    emailPort: number;
    emailSecure: boolean;
  };

