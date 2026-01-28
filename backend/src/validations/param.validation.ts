import { param } from 'express-validator';

export const validateMongoId = [
  param('id').isMongoId().withMessage('Invalid MongoDB ObjectId'),
];
