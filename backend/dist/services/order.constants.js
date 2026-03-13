"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOrderNumber = exports.normalizeSize = exports.DEFAULT_SIZE_LABEL = exports.TAX_RATE = exports.SHIPPING_COSTS = void 0;
const SHIPPING_COSTS = {
    standard: 0,
    express: 9.99,
    next_day: 19.99,
};
exports.SHIPPING_COSTS = SHIPPING_COSTS;
const TAX_RATE = 0.08; // 8%
exports.TAX_RATE = TAX_RATE;
const DEFAULT_SIZE_LABEL = 'ONE_SIZE';
exports.DEFAULT_SIZE_LABEL = DEFAULT_SIZE_LABEL;
const normalizeSize = (size) => (size ? size.trim().toUpperCase() : undefined);
exports.normalizeSize = normalizeSize;
const generateOrderNumber = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const random = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `PHT-${random}`;
};
exports.generateOrderNumber = generateOrderNumber;
