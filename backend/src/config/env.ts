import dotenv from 'dotenv';

dotenv.config();

interface RequiredEnv {
  mongoUri: string;
  jwtSecret: string;
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
  jwtExpires: process.env.JWT_EXPIRES || '1h',
  port: Number(process.env.PORT) || 5000,
} satisfies RequiredEnv & { jwtExpires: string; port: number };

