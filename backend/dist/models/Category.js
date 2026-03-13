"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const CategorySchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true,
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
}, {
    versionKey: false,
});
exports.default = (0, mongoose_1.model)('Category', CategorySchema);
