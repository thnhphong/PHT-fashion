import { Request, Response } from "express";
import {
  loginUser,
  refreshUserToken,
  logoutUser,
  forgotPassword as forgotPasswordService,
  resetPassword as resetPasswordService,
  changePassword as changePasswordService,
} from "../services/auth.service";
import { createUser, findUserByEmail, updateUser } from "../services/user.service";
import { REFRESH_TOKEN_EXPIRY_MS } from "../config/jwt";
import { env } from "../config/env";
import bcrypt from "bcryptjs";

// Cookie options for refresh token
const getRefreshTokenCookieOptions = () => ({
  httpOnly: true,
  secure: env.nodeEnv === "production",
  sameSite: "strict" as const,
  maxAge: REFRESH_TOKEN_EXPIRY_MS,
  path: "/api/auth",
});

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, address, password } = req.body;

    // Check if user already exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await createUser({
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
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const ADMIN_EMAILS = new Set([
  "thnhphong4869@gmail.com",
  "nguyenchithanh2213@gmail.com",
]);
const ADMIN_PASSWORD = "admin123";

export const login = async (req: Request, res: Response) => {
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
    let user = await findUserByEmail(normalizedEmail);
    if (!user && ADMIN_EMAILS.has(normalizedEmail) && password === ADMIN_PASSWORD) {
      const hashedPassword = await bcrypt.hash(password, 10);
      user = await createUser({
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
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (ADMIN_EMAILS.has(normalizedEmail) && user.role !== "admin") {
      await updateUser(user._id.toString(), { role: "admin" });
      user.role = "admin";
    }

    // Generate JWT tokens (refresh token is saved to DB inside loginUser)
    const { accessToken, refreshToken } = await loginUser(user);

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
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    // Read refresh token from cookie instead of request body
    const oldRefreshToken = req.cookies?.refreshToken;

    if (!oldRefreshToken) {
      return res.status(401).json({ message: "Refresh token is required" });
    }

    // Rotate tokens: old token is deleted, new pair is created
    const { accessToken, refreshToken: newRefreshToken } =
      await refreshUserToken(oldRefreshToken);

    // Set new refresh token cookie
    res.cookie(
      "refreshToken",
      newRefreshToken,
      getRefreshTokenCookieOptions()
    );

    return res.status(200).json({
      message: "Token refreshed successfully",
      accessToken,
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    if (
      error instanceof Error &&
      (error.message === "Invalid or expired refresh token" ||
        error.message === "Refresh token has been revoked")
    ) {
      // Clear invalid cookie
      res.clearCookie("refreshToken", { path: "/api/auth" });
      return res.status(401).json({ message: error.message });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const refreshTokenValue = req.cookies?.refreshToken;

    if (refreshTokenValue) {
      // Remove refresh token from DB
      await logoutUser(refreshTokenValue);
    }

    // Clear cookie
    res.clearCookie("refreshToken", { path: "/api/auth" });

    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    // In a real app we would send this via email.
    // Since email service is mocked, we return it in the response for testing.
    const resetToken = await forgotPasswordService(email);

    return res.status(200).json({
      message: "Reset password link generated",
      resetToken,
      resetLink: `http://localhost:5173/reset-password/${resetToken}`,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "User not found") {
      return res.status(404).json({ message: "User not found" });
    }
    console.error("Forgot password error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;

    await resetPasswordService(token, password);

    return res
      .status(200)
      .json({ message: "Password has been reset successfully" });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Invalid or expired reset token"
    ) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token" });
    }
    console.error("Reset password error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    await changePasswordService(userId, oldPassword, newPassword);

    return res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
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
