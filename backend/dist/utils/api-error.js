"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isApiError = exports.ApiError = void 0;
class ApiError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'ApiError';
        Object.setPrototypeOf(this, ApiError.prototype);
    }
}
exports.ApiError = ApiError;
const isApiError = (value) => {
    return value instanceof ApiError;
};
exports.isApiError = isApiError;
