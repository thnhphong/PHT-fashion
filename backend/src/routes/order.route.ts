import { Router } from 'express';
import {
  cancelMyOrder,
  cancelOrderDraft,
  cancelGuestOrderDraft,
  createOrder,
  createGuestOrder,
  finalizeOrderDraft,
  finalizeGuestOrderDraft,
  getMyOrders,
  getOrder,
  adminGetAllOrders,
  adminGetOrder,
  adminUpdateOrderStatus,
  adminCancelOrder,
} from '../controllers/order.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireAdminEmail } from '../middlewares/role.middleware';

const router = Router();

// ─── Guest routes (unauthenticated) ──────────────────────────────────────────

// POST /api/orders/guest            → place a new guest order draft
router.post('/guest', createGuestOrder);

// POST /api/orders/guest/drafts/:draftId/finalize → finalize guest draft
router.post('/guest/drafts/:draftId/finalize', finalizeGuestOrderDraft);

// POST /api/orders/guest/drafts/:draftId/cancel → cancel an existing guest draft
router.post('/guest/drafts/:draftId/cancel', cancelGuestOrderDraft);

// ─── Customer routes (authenticated) ─────────────────────────────────────────

// POST /api/orders            → place a new order
router.post('/', authenticate, createOrder);

// POST /api/orders/drafts/:draftId/finalize → finalize draft
router.post('/drafts/:draftId/finalize', authenticate, finalizeOrderDraft);

// POST /api/orders/drafts/:draftId/cancel → cancel an existing draft
router.post('/drafts/:draftId/cancel', authenticate, cancelOrderDraft);

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