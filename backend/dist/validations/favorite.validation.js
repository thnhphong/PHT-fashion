"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeFavoritesSchema = void 0;
const zod_1 = require("zod");
exports.mergeFavoritesSchema = zod_1.z.object({
    productIds: zod_1.z.array(zod_1.z.string().min(1)).default([]),
});
