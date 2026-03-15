"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeCart = exports.clearCart = exports.removeItem = exports.updateItem = exports.addItem = exports.getCart = void 0;
const Cart_1 = __importDefault(require("../models/Cart"));
const mongoose_1 = require("mongoose");
const populateCartItems = (query) => query.populate({
    path: 'items.productId',
    select: 'name price img_url stock sizes categoryId supplierId',
    populate: [
        { path: 'categoryId', select: 'name' },
        { path: 'supplierId', select: 'name' },
    ],
});
const getCart = async (userId) => {
    let cart = await populateCartItems(Cart_1.default.findOne({ userId: new mongoose_1.Types.ObjectId(userId) }));
    if (!cart) {
        cart = await Cart_1.default.create({ userId: new mongoose_1.Types.ObjectId(userId), items: [] });
    }
    return cart;
};
exports.getCart = getCart;
const addItem = async (userId, productId, size, quantity) => {
    let cart = await Cart_1.default.findOne({ userId: new mongoose_1.Types.ObjectId(userId) });
    if (!cart) {
        cart = new Cart_1.default({ userId: new mongoose_1.Types.ObjectId(userId), items: [] });
    }
    const existing = cart.items.find((item) => item.productId.toString() === productId && item.size === size);
    if (existing) {
        existing.quantity += quantity;
    }
    else {
        cart.items.push({
            productId: new mongoose_1.Types.ObjectId(productId),
            size,
            quantity,
            addedAt: new Date(),
        });
    }
    await cart.save();
    return populateCartItems(Cart_1.default.findById(cart._id));
};
exports.addItem = addItem;
const updateItem = async (userId, productId, size, quantity) => {
    const cart = await Cart_1.default.findOne({ userId: new mongoose_1.Types.ObjectId(userId) });
    if (!cart)
        throw new Error('Cart not found');
    const item = cart.items.find((item) => item.productId.toString() === productId && item.size === size);
    if (!item)
        throw new Error('Item not found in cart');
    item.quantity = quantity;
    await cart.save();
    return populateCartItems(Cart_1.default.findById(cart._id));
};
exports.updateItem = updateItem;
const removeItem = async (userId, productId, size) => {
    const cart = await Cart_1.default.findOne({ userId: new mongoose_1.Types.ObjectId(userId) });
    if (!cart)
        throw new Error('Cart not found');
    cart.items = cart.items.filter((item) => !(item.productId.toString() === productId && item.size === size));
    await cart.save();
    return populateCartItems(Cart_1.default.findById(cart._id));
};
exports.removeItem = removeItem;
const clearCart = async (userId) => {
    const cart = await Cart_1.default.findOne({ userId: new mongoose_1.Types.ObjectId(userId) });
    if (!cart)
        return null;
    cart.items = [];
    await cart.save();
    return cart;
};
exports.clearCart = clearCart;
const mergeCart = async (userId, guestItems) => {
    let cart = await Cart_1.default.findOne({ userId: new mongoose_1.Types.ObjectId(userId) });
    if (!cart) {
        cart = new Cart_1.default({ userId: new mongoose_1.Types.ObjectId(userId), items: [] });
    }
    for (const guestItem of guestItems) {
        const existing = cart.items.find((item) => item.productId.toString() === guestItem.productId &&
            item.size === guestItem.size);
        if (existing) {
            existing.quantity = Math.max(existing.quantity, guestItem.quantity);
        }
        else {
            cart.items.push({
                productId: new mongoose_1.Types.ObjectId(guestItem.productId),
                size: guestItem.size,
                quantity: guestItem.quantity,
                addedAt: new Date(),
            });
        }
    }
    await cart.save();
    return populateCartItems(Cart_1.default.findById(cart._id));
};
exports.mergeCart = mergeCart;
