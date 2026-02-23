import { Router } from 'express';
import {
  createOrder,
  getMyOrders,
  getOrder,
  cancelMyOrder,
  adminGetAllOrders,
  adminGetOrder,
  adminUpdateOrderStatus,
  adminCancelOrder,
} from '../controllers/order.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireAdminEmail } from '../middlewares/role.middleware';

const router = Router();

// ─── Customer routes (authenticated) ─────────────────────────────────────────

// POST /api/orders            → place a new order
router.post('/', authenticate, createOrder);

// GET  /api/orders/my         → list own orders
router.get('/my', authenticate, getMyOrders);

// GET  /api/orders/:id        → get single order (own or admin)
router.get('/:id', authenticate, getOrder);

// POST /api/orders/:id/cancel → cancel own order
router.post('/:id/cancel', authenticate, cancelMyOrder);

// ─── Admin routes ─────────────────────────────────────────────────────────────
// Register these under /api/admin/orders in index.ts

export const adminOrderRouter = Router();

// GET    /api/admin/orders                → paginated list with optional status filter
adminOrderRouter.get('/', authenticate, requireAdminEmail, adminGetAllOrders);

// GET    /api/admin/orders/:id            → single order detail
adminOrderRouter.get('/:id', authenticate, requireAdminEmail, adminGetOrder);

// PATCH  /api/admin/orders/:id/status     → update order / payment status
adminOrderRouter.patch('/:id/status', authenticate, requireAdminEmail, adminUpdateOrderStatus);

// POST   /api/admin/orders/:id/cancel     → force-cancel any order
adminOrderRouter.post('/:id/cancel', authenticate, requireAdminEmail, adminCancelOrder);

export default router;