"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyAuthToken = exports.signAuthToken = exports.REFRESH_TOKEN_EXPIRY_MS = exports.ACCESS_TOKEN_EXPIRY_MS = exports.verifyRefreshToken = exports.verifyToken = exports.signResetPasswordToken = exports.signRefreshToken = exports.signAccessToken = void 0;
const jsonwebtoken_1 = require("jsonwebtoken");
const env_1 = require("./env");
const jwtSecret = env_1.env.jwtSecret;
const refreshTokenSecret = env_1.env.refreshTokenSecret;
// Access Token: 15 minutes
const accessTokenOptions = {
    expiresIn: '15m',
};
// Refresh Token: 7 days
const refreshTokenOptions = {
    expiresIn: '7d',
};
const signAccessToken = (payload) => {
    return (0, jsonwebtoken_1.sign)(payload, jwtSecret, accessTokenOptions);
};
exports.signAccessToken = signAccessToken;
const signRefreshToken = (payload) => {
    return (0, jsonwebtoken_1.sign)(payload, refreshTokenSecret, refreshTokenOptions);
};
exports.signRefreshToken = signRefreshToken;
// Reset Password Token: 10 minutes
const resetPasswordOptions = {
    expiresIn: '10m',
};
const signResetPasswordToken = (payload) => {
    return (0, jsonwebtoken_1.sign)(payload, jwtSecret, resetPasswordOptions);
};
exports.signResetPasswordToken = signResetPasswordToken;
// Verify access token (uses jwtSecret)
const verifyToken = (token) => {
    return (0, jsonwebtoken_1.verify)(token, jwtSecret);
};
exports.verifyToken = verifyToken;
// Verify refresh token (uses refreshTokenSecret)
const verifyRefreshToken = (token) => {
    return (0, jsonwebtoken_1.verify)(token, refreshTokenSecret);
};
exports.verifyRefreshToken = verifyRefreshToken;
// Access token expiry in milliseconds (15 minutes) — used for cookie maxAge
exports.ACCESS_TOKEN_EXPIRY_MS = 15 * 60 * 1000;
// Refresh token expiry in milliseconds (7 days) — used for cookie maxAge and DB expiresAt
exports.REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;
// Kept for backward compatibility
exports.signAuthToken = exports.signAccessToken;
exports.verifyAuthToken = exports.verifyToken;
