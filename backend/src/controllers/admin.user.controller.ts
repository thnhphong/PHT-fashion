import { Request, Response } from 'express';
import User from '../models/User';

interface QueryParams {
  search?: string;
  role?: string;
  page?: string;
  limit?: string;
}

export const getAllUsersAdmin = async (req: Request, res: Response) => {
  try {
    const { search, role, page = '1', limit = '20' } = req.query as QueryParams;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const filter: Record<string, unknown> = {};

    if (role && (role === 'customer' || role === 'admin')) {
      filter.role = role;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      User.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    return res.status(200).json({
      data: users,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems: total,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    });
  } catch (error) {
    console.error('Admin get users error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getUserByIdAdmin = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select('-password').lean();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error('Admin get user by id error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateUserAdmin = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address, role } = req.body;

    const updateData: Record<string, unknown> = {};

    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (role !== undefined && (role === 'customer' || role === 'admin')) {
      updateData.role = role;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .select('-password')
      .lean();

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({
      message: 'User updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Admin update user error:', error);
    if ((error as Error).message?.includes('duplicate key')) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteUserAdmin = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const currentUser = req.user;
    if (currentUser?.sub === id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Admin delete user error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
