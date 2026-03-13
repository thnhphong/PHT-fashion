"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const ensureEnv = (value, name) => {
    if (!value) {
        throw new Error(`Please set the ${name} environment variable`);
    }
    return value;
};
exports.env = {
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
};
