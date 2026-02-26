
import { createClient, RedisClientType } from 'redis';

const REDIS_URL = process.env.REDIS_URL ?? 'redis://127.0.0.1:6379';

let redisClient: RedisClientType | null = null;

const getClient = (): RedisClientType => {
  if (!redisClient) {
    redisClient = createClient({ url: REDIS_URL });
    redisClient.on('error', (error) => {
      console.error('Redis client error:', error);
    });
    redisClient.on('end', () => {
      redisClient = null;
    });
  }
  return redisClient;
};

export const connectRedis = async () => {
  const client = getClient();
  if (!client.isOpen) {
    await client.connect();
  }
  return client;
};

export const getRedisClient = (): RedisClientType => {
  if (!redisClient) {
    throw new Error('Redis client has not been initialized yet');
  }
  if (!redisClient.isOpen) {
    throw new Error('Redis client is not connected');
  }
  return redisClient;
};

export const disconnectRedis = async () => {
  if (redisClient && redisClient.isOpen) {
    await redisClient.disconnect();
  }
};
