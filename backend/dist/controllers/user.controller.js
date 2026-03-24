"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCurrentUser = exports.getCurrentUser = exports.deleteUserById = exports.updateUserById = exports.getUsers = exports.getUser = exports.registerUser = void 0;
const user_service_1 = require("../services/user.service");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const registerUser = async (req, res) => {
    try {
        const { name, email, phone, address, password } = req.body;
        const existingUser = await (0, user_service_1.findUserByEmail)(email);
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }
        // Hash password before saving
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const newUser = await (0, user_service_1.createUser)({
            name,
            email,
            phone,
            address,
            password: hashedPassword
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
    }
    catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.registerUser = registerUser;
const getUser = async (req, res) => {
    try {
        const id = req.params.id;
        const user = await (0, user_service_1.findUserById)(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        return res.status(200).json(user);
    }
    catch (error) {
        console.error('Get user error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getUser = getUser;
const getUsers = async (req, res) => {
    try {
        const users = await (0, user_service_1.getAllUsers)();
        return res.status(200).json(users);
    }
    catch (error) {
        console.error('Get users error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getUsers = getUsers;
const updateUserById = async (req, res) => {
    try {
        const id = req.params.id;
        const userData = req.body;
        // If password is being updated, hash it
        if (userData.password) {
            userData.password = await bcryptjs_1.default.hash(userData.password, 10);
        }
        const updatedUser = await (0, user_service_1.updateUser)(id, userData);
        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        return res.status(200).json({
            message: 'User updated successfully',
            user: updatedUser,
        });
    }
    catch (error) {
        console.error('Update user error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.updateUserById = updateUserById;
const deleteUserById = async (req, res) => {
    try {
        const id = req.params.id;
        const deletedUser = await (0, user_service_1.deleteUser)(id);
        if (!deletedUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        return res.status(200).json({ message: 'User deleted successfully' });
    }
    catch (error) {
        console.error('Delete user error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.deleteUserById = deleteUserById;
const getCurrentUser = async (req, res) => {
    try {
        const userId = req.user?.sub;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const user = await (0, user_service_1.findUserById)(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        return res.status(200).json(user);
    }
    catch (error) {
        console.error('Get current user error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getCurrentUser = getCurrentUser;
const updateCurrentUser = async (req, res) => {
    try {
        const userId = req.user?.sub;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const { name, phone, address, avatar } = req.body;
        const updatedUser = await (0, user_service_1.updateUser)(userId, { name, phone, address, avatar });
        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        return res.status(200).json({
            message: 'Profile updated successfully',
            user: updatedUser,
        });
    }
    catch (error) {
        console.error('Update current user error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.updateCurrentUser = updateCurrentUser;
