"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const CouponSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    count: { type: Number, required: true, min: 0, max: 100 },
    discount: { type: Number, required: true, min: 0 },
    expiration_date: { type: Date, required: true },
    created_at: { type: Date, default: Date.now },
}, { versionKey: false });
exports.default = (0, mongoose_1.model)('Coupon', CouponSchema);
