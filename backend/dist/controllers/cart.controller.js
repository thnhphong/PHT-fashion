"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeCart = exports.clearCart = exports.removeItem = exports.updateItem = exports.addItem = exports.getCart = void 0;
const cartService = __importStar(require("../services/cart.service"));
const getCart = async (req, res) => {
    try {
        const userId = req.user?.sub;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const cart = await cartService.getCart(userId);
        return res.json(cart ?? { items: [] });
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : 'Internal server error';
        return res.status(500).json({ message: msg });
    }
};
exports.getCart = getCart;
const addItem = async (req, res) => {
    try {
        const userId = req.user?.sub;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const { productId, size, quantity } = req.body;
        const cart = await cartService.addItem(userId, productId, size, quantity);
        return res.status(201).json(cart);
    }
    catch (error) {
        return res.status(500).json({ message: error.message || 'Internal server error' });
    }
};
exports.addItem = addItem;
const updateItem = async (req, res) => {
    try {
        const userId = req.user?.sub;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const { productId } = req.params;
        const { size, quantity } = req.body;
        const cart = await cartService.updateItem(userId, productId, size, quantity);
        return res.json(cart);
    }
    catch (error) {
        if (error.message === 'Cart not found' || error.message === 'Item not found in cart') {
            return res.status(404).json({ message: error.message });
        }
        return res.status(500).json({ message: error.message || 'Internal server error' });
    }
};
exports.updateItem = updateItem;
const removeItem = async (req, res) => {
    try {
        const userId = req.user?.sub;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const { productId } = req.params;
        const { size } = req.body;
        const cart = await cartService.removeItem(userId, productId, size);
        return res.json(cart);
    }
    catch (error) {
        if (error.message === 'Cart not found') {
            return res.status(404).json({ message: error.message });
        }
        return res.status(500).json({ message: error.message || 'Internal server error' });
    }
};
exports.removeItem = removeItem;
const clearCart = async (req, res) => {
    try {
        const userId = req.user?.sub;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        await cartService.clearCart(userId);
        return res.json({ message: 'Cart cleared' });
    }
    catch (error) {
        return res.status(500).json({ message: error.message || 'Internal server error' });
    }
};
exports.clearCart = clearCart;
const mergeCart = async (req, res) => {
    try {
        const userId = req.user?.sub;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const { items } = req.body;
        const cart = await cartService.mergeCart(userId, items);
        return res.json(cart);
    }
    catch (error) {
        return res.status(500).json({ message: error.message || 'Internal server error' });
    }
};
exports.mergeCart = mergeCart;
