"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateMongoId = void 0;
const express_validator_1 = require("express-validator");
exports.validateMongoId = [
    (0, express_validator_1.param)('id').isMongoId().withMessage('Invalid MongoDB ObjectId'),
];
