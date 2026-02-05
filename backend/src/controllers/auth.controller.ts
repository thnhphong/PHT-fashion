import { Request, Response } from 'express';
import { loginUser, refreshUserToken } from '../services/auth.service';
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