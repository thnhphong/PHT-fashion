"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdminEmail = void 0;
const ADMIN_EMAILS = new Set([
    'thnhphong4869@gmail.com',
    'nguyenchithanh2213@gmail.com',
]);
const requireAdminEmail = (req, res, next) => {
    if (!req.user || !req.user.email) {
        return res.status(401).json({ message: 'Unauthorized: Missing user' });
    }
    if (!ADMIN_EMAILS.has(req.user.email.toLowerCase())) {
        return res.status(403).json({ message: 'Forbidden: Admin only' });
    }
    next();
};
exports.requireAdminEmail = requireAdminEmail;
