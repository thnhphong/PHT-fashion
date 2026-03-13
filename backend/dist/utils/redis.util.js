"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectRedis = exports.getRedisClient = exports.connectRedis = void 0;
const redis_1 = require("redis");
const REDIS_URL = process.env.REDIS_URL ?? 'redis://127.0.0.1:6379';
let redisClient = null;
const getClient = () => {
    if (!redisClient) {
        redisClient = (0, redis_1.createClient)({ url: REDIS_URL });
        redisClient.on('error', (error) => {
            console.error('Redis client error:', error);
        });
        redisClient.on('end', () => {
            redisClient = null;
        });
    }
    return redisClient;
};
const connectRedis = async () => {
    const client = getClient();
    if (!client.isOpen) {
        await client.connect();
    }
    return client;
};
exports.connectRedis = connectRedis;
const getRedisClient = () => {
    if (!redisClient) {
        throw new Error('Redis client has not been initialized yet');
    }
    if (!redisClient.isOpen) {
        throw new Error('Redis client is not connected');
    }
    return redisClient;
};
exports.getRedisClient = getRedisClient;
const disconnectRedis = async () => {
    if (redisClient && redisClient.isOpen) {
        await redisClient.disconnect();
    }
};
exports.disconnectRedis = disconnectRedis;
