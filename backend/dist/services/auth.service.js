"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePassword = exports.resetPassword = exports.forgotPassword = exports.logoutAllDevices = exports.logoutUser = exports.refreshUserToken = exports.loginUser = void 0;
const jwt_1 = require("../config/jwt");
const user_service_1 = require("./user.service");
const RefreshToken_1 = __importDefault(require("../models/RefreshToken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const loginUser = async (user) => {
    const payload = {
        sub: user._id.toString(),
        role: user.role,
        email: user.email,
    };
    const accessToken = (0, jwt_1.signAccessToken)(payload);
    const refreshToken = (0, jwt_1.signRefreshToken)(payload);
    // Save refresh token to database
    await RefreshToken_1.default.create({
        token: refreshToken,
        userId: user._id,
        expiresAt: new Date(Date.now() + jwt_1.REFRESH_TOKEN_EXPIRY_MS),
    });
    return { accessToken, refreshToken };
};
exports.loginUser = loginUser;
const refreshUserToken = async (oldRefreshToken) => {
    // 1. Verify the token signature
    const payload = (0, jwt_1.verifyRefreshToken)(oldRefreshToken);
    // 2. Check if token exists in DB (not revoked)
    const storedToken = await RefreshToken_1.default.findOne({ token: oldRefreshToken });
    if (!storedToken) {
        throw new Error('Refresh token has been revoked');
    }
    // 3. Delete the old token (rotation)
    await RefreshToken_1.default.deleteOne({ _id: storedToken._id });
    // 4. Create new token pair
    const newPayload = {
        sub: payload.sub,
        role: payload.role,
        email: payload.email,
    };
    const newAccessToken = (0, jwt_1.signAccessToken)(newPayload);
    const newRefreshToken = (0, jwt_1.signRefreshToken)(newPayload);
    // 5. Save new refresh token to DB
    await RefreshToken_1.default.create({
        token: newRefreshToken,
        userId: payload.sub,
        expiresAt: new Date(Date.now() + jwt_1.REFRESH_TOKEN_EXPIRY_MS),
    });
    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};
exports.refreshUserToken = refreshUserToken;
const logoutUser = async (refreshToken) => {
    await RefreshToken_1.default.deleteOne({ token: refreshToken });
};
exports.logoutUser = logoutUser;
const logoutAllDevices = async (userId) => {
    await RefreshToken_1.default.deleteMany({ userId });
};
exports.logoutAllDevices = logoutAllDevices;
const forgotPassword = async (email) => {
    const user = await (0, user_service_1.findUserByEmail)(email);
    if (!user) {
        throw new Error('User not found');
    }
    const payload = {
        sub: user._id.toString(),
        role: user.role,
        email: user.email,
    };
    const resetToken = (0, jwt_1.signResetPasswordToken)(payload);
    return resetToken;
};
exports.forgotPassword = forgotPassword;
const resetPassword = async (token, newPassword) => {
    try {
        const payload = (0, jwt_1.verifyToken)(token);
        const userId = payload.sub;
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 10);
        await (0, user_service_1.updateUser)(userId, { password: hashedPassword });
        return true;
    }
    catch (error) {
        throw new Error('Invalid or expired reset token');
    }
};
exports.resetPassword = resetPassword;
const changePassword = async (userId, oldPassword, newPassword) => {
    // We need to fetch user with password to verify
    const user = await (0, user_service_1.findUserByIdWithPassword)(userId);
    if (!user) {
        throw new Error('User not found');
    }
    const isMatch = await bcryptjs_1.default.compare(oldPassword, user.password);
    if (!isMatch) {
        throw new Error('Incorrect old password');
    }
    const hashedPassword = await bcryptjs_1.default.hash(newPassword, 10);
    await (0, user_service_1.updateUser)(userId, { password: hashedPassword });
    return true;
};
exports.changePassword = changePassword;
