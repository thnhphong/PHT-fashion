"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateParams = void 0;
const express_validator_1 = require("express-validator");
const validateParams = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Validation failed',
            errors: errors.array().map((err) => ({
                field: err.path || err.param,
                message: err.msg,
            })),
        });
    }
    next();
};
exports.validateParams = validateParams;
