"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePassword = exports.resetPassword = exports.forgotPassword = exports.logout = exports.refreshToken = exports.login = exports.register = void 0;
const auth_service_1 = require("../services/auth.service");
const user_service_1 = require("../services/user.service");
const jwt_1 = require("../config/jwt");
const env_1 = require("../config/env");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
// Cookie options for refresh token
const getRefreshTokenCookieOptions = () => ({
    httpOnly: true,
    secure: env_1.env.nodeEnv === "production",
    sameSite: "strict",
    maxAge: jwt_1.REFRESH_TOKEN_EXPIRY_MS,
    path: "/api/auth",
});
const register = async (req, res) => {
    try {
        const { name, email, phone, address, password } = req.body;
        // Check if user already exists
        const existingUser = await (0, user_service_1.findUserByEmail)(email);
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }
        // Hash password
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        // Create user
        const newUser = await (0, user_service_1.createUser)({
            name,
            email,
            phone,
            address,
            password: hashedPassword,
        });
        // Remove password from response
        const userResponse = {
            _id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            phone: newUser.phone,
            address: newUser.address,
            role: newUser.role,
            avatar: newUser.avatar,
            created_at: newUser.created_at,
        };
        return res.status(201).json({
            message: "User registered successfully",
            user: userResponse,
        });
    }
    catch (error) {
        console.error("Registration error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
exports.register = register;
const ADMIN_EMAILS = new Set([
    "thnhphong4869@gmail.com",
    "nguyenchithanh2213@gmail.com",
]);
const ADMIN_PASSWORD = "admin123";
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        // Validate input
        if (!email || !password) {
            return res
                .status(400)
                .json({ message: "Email and password are required" });
        }
        // Find user
        const normalizedEmail = email.toLowerCase();
        let user = await (0, user_service_1.findUserByEmail)(normalizedEmail);
        if (!user && ADMIN_EMAILS.has(normalizedEmail) && password === ADMIN_PASSWORD) {
            const hashedPassword = await bcryptjs_1.default.hash(password, 10);
            user = await (0, user_service_1.createUser)({
                name: 'Admin',
                email: normalizedEmail,
                phone: '0000000000',
                address: 'Admin HQ',
                password: hashedPassword,
                role: 'admin',
            });
        }
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }
        // Verify password
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid email or password" });
        }
        if (ADMIN_EMAILS.has(normalizedEmail) && user.role !== "admin") {
            await (0, user_service_1.updateUser)(user._id.toString(), { role: "admin" });
            user.role = "admin";
        }
        // Generate JWT tokens (refresh token is saved to DB inside loginUser)
        const { accessToken, refreshToken } = await (0, auth_service_1.loginUser)(user);
        // Set refresh token as httpOnly cookie
        res.cookie("refreshToken", refreshToken, getRefreshTokenCookieOptions());
        // Remove password from response
        const userResponse = {
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            address: user.address,
            role: user.role,
            avatar: user.avatar,
            created_at: user.created_at,
        };
        // Only return accessToken in response body (refreshToken is in cookie)
        return res.status(200).json({
            message: "Login successful",
            accessToken,
            user: userResponse,
        });
    }
    catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
exports.login = login;
const refreshToken = async (req, res) => {
    try {
        // Read refresh token from cookie instead of request body
        const oldRefreshToken = req.cookies?.refreshToken;
        if (!oldRefreshToken) {
            return res.status(401).json({ message: "Refresh token is required" });
        }
        // Rotate tokens: old token is deleted, new pair is created
        const { accessToken, refreshToken: newRefreshToken } = await (0, auth_service_1.refreshUserToken)(oldRefreshToken);
        // Set new refresh token cookie
        res.cookie("refreshToken", newRefreshToken, getRefreshTokenCookieOptions());
        return res.status(200).json({
            message: "Token refreshed successfully",
            accessToken,
        });
    }
    catch (error) {
        console.error("Refresh token error:", error);
        if (error instanceof Error &&
            (error.message === "Invalid or expired refresh token" ||
                error.message === "Refresh token has been revoked")) {
            // Clear invalid cookie
            res.clearCookie("refreshToken", { path: "/api/auth" });
            return res.status(401).json({ message: error.message });
        }
        return res.status(500).json({ message: "Internal server error" });
    }
};
exports.refreshToken = refreshToken;
const logout = async (req, res) => {
    try {
        const refreshTokenValue = req.cookies?.refreshToken;
        if (refreshTokenValue) {
            // Remove refresh token from DB
            await (0, auth_service_1.logoutUser)(refreshTokenValue);
        }
        // Clear cookie
        res.clearCookie("refreshToken", { path: "/api/auth" });
        return res.status(200).json({ message: "Logged out successfully" });
    }
    catch (error) {
        console.error("Logout error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
exports.logout = logout;
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        // In a real app we would send this via email.
        // Since email service is mocked, we return it in the response for testing.
        const resetToken = await (0, auth_service_1.forgotPassword)(email);
        return res.status(200).json({
            message: "Reset password link generated",
            resetToken,
            resetLink: `http://localhost:5173/reset-password/${resetToken}`,
        });
    }
    catch (error) {
        if (error instanceof Error && error.message === "User not found") {
            return res.status(404).json({ message: "User not found" });
        }
        console.error("Forgot password error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
exports.forgotPassword = forgotPassword;
const resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;
        await (0, auth_service_1.resetPassword)(token, password);
        return res
            .status(200)
            .json({ message: "Password has been reset successfully" });
    }
    catch (error) {
        if (error instanceof Error &&
            error.message === "Invalid or expired reset token") {
            return res
                .status(400)
                .json({ message: "Invalid or expired reset token" });
        }
        console.error("Reset password error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
exports.resetPassword = resetPassword;
const changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const userId = req.user?.sub;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        await (0, auth_service_1.changePassword)(userId, oldPassword, newPassword);
        return res.status(200).json({ message: "Password changed successfully" });
    }
    catch (error) {
        if (error instanceof Error && error.message === "Incorrect old password") {
            return res.status(400).json({ message: "Incorrect old password" });
        }
        if (error instanceof Error && error.message === "User not found") {
            return res.status(404).json({ message: "User not found" });
        }
        console.error("Change password error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
exports.changePassword = changePassword;
