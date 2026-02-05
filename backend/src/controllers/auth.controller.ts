import { Request, Response } from 'express';
import { loginUser, refreshUserToken, forgotPassword as forgotPasswordService, resetPassword as resetPasswordService, changePassword as changePasswordService } from '../services/auth.service';
import { createUser, findUserByEmail } from '../services/user.service';
import bcrypt from 'bcryptjs';

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, address, password } = req.body;

    // Check if user already exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
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
      message: 'User registered successfully',
      user: userResponse,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate JWT tokens
    const { accessToken, refreshToken } = loginUser(user);

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

    return res.status(200).json({
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: userResponse,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }

    const newAccessToken = refreshUserToken(refreshToken);

    return res.status(200).json({
      message: 'Token refreshed successfully',
      accessToken: newAccessToken,
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    if (error instanceof Error && error.message === 'Invalid or expired refresh token') {
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    // In a real app we would send this via email.
    // Since email service is mocked, we return it in the response for testing.
    const resetToken = await forgotPasswordService(email);

    return res.status(200).json({
      message: 'Reset password link generated',
      resetToken,
      resetLink: `http://localhost:5173/reset-password/${resetToken}`
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'User not found') {
      return res.status(404).json({ message: 'User not found' });
    }
    console.error('Forgot password error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};



export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;

    await resetPasswordService(token, password);

    return res.status(200).json({ message: 'Password has been reset successfully' });
  } catch (error) {
    if (error instanceof Error && error.message === 'Invalid or expired reset token') {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }
    console.error('Reset password error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    await changePasswordService(userId, oldPassword, newPassword);

    return res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    if (error instanceof Error && error.message === 'Incorrect old password') {
      return res.status(400).json({ message: 'Incorrect old password' });
    }
    if (error instanceof Error && error.message === 'User not found') {
      return res.status(404).json({ message: 'User not found' });
    }
    console.error('Change password error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};