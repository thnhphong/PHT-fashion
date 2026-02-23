import { Request, Response, NextFunction } from 'express';

const ADMIN_EMAILS = new Set([
  'thnhphong4869@gmail.com',
  'nguyenchithanh2213@gmail.com',
]);

export const requireAdminEmail = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || !req.user.email) {
    return res.status(401).json({ message: 'Unauthorized: Missing user' });
  }
  if (!ADMIN_EMAILS.has(req.user.email.toLowerCase())) {
    return res.status(403).json({ message: 'Forbidden: Admin only' });
  }
  next();
};