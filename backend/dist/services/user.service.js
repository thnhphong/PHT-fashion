"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateUser = exports.getAllUsers = exports.findUserByIdWithPassword = exports.findUserById = exports.findUserByEmail = exports.createUser = void 0;
const User_1 = __importDefault(require("../models/User"));
const createUser = async (userData) => {
    const newUser = new User_1.default(userData);
    await newUser.save();
    return newUser;
};
exports.createUser = createUser;
const findUserByEmail = async (email) => {
    return User_1.default.findOne({ email });
};
exports.findUserByEmail = findUserByEmail;
const findUserById = async (id) => {
    return User_1.default.findById(id).select('-password');
};
exports.findUserById = findUserById;
const findUserByIdWithPassword = async (id) => {
    return User_1.default.findById(id);
};
exports.findUserByIdWithPassword = findUserByIdWithPassword;
const getAllUsers = async () => {
    return User_1.default.find().select('-password');
};
exports.getAllUsers = getAllUsers;
const updateUser = async (id, userData) => {
    return User_1.default.findByIdAndUpdate(id, userData, { new: true }).select('-password');
};
exports.updateUser = updateUser;
const deleteUser = async (id) => {
    return User_1.default.findByIdAndDelete(id);
};
exports.deleteUser = deleteUser;
