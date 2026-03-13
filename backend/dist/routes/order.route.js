"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminOrderRouter = void 0;
const express_1 = require("express");
const order_controller_1 = require("../controllers/order.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const role_middleware_1 = require("../middlewares/role.middleware");
const router = (0, express_1.Router)();
// ─── Customer routes (authenticated) ─────────────────────────────────────────
// POST /api/orders            → place a new order
router.post('/', auth_middleware_1.authenticate, order_controller_1.createOrder);
// POST /api/orders/drafts/:draftId/finalize → finalize draft
router.post('/drafts/:draftId/finalize', auth_middleware_1.authenticate, order_controller_1.finalizeOrderDraft);
// POST /api/orders/drafts/:draftId/cancel → cancel an existing draft
router.post('/drafts/:draftId/cancel', auth_middleware_1.authenticate, order_controller_1.cancelOrderDraft);
// GET  /api/orders/my         → list own orders
router.get('/my', auth_middleware_1.authenticate, order_controller_1.getMyOrders);
// GET  /api/orders/:id        → get single order (own or admin)
router.get('/:id', auth_middleware_1.authenticate, order_controller_1.getOrder);
// POST /api/orders/:id/cancel → cancel own order
router.post('/:id/cancel', auth_middleware_1.authenticate, order_controller_1.cancelMyOrder);
// ─── Admin routes ─────────────────────────────────────────────────────────────
// Register these under /api/admin/orders in index.ts
exports.adminOrderRouter = (0, express_1.Router)();
// GET    /api/admin/orders                → paginated list with optional status filter
exports.adminOrderRouter.get('/', auth_middleware_1.authenticate, role_middleware_1.requireAdminEmail, order_controller_1.adminGetAllOrders);
// GET    /api/admin/orders/:id            → single order detail
exports.adminOrderRouter.get('/:id', auth_middleware_1.authenticate, role_middleware_1.requireAdminEmail, order_controller_1.adminGetOrder);
// PATCH  /api/admin/orders/:id/status     → update order / payment status
exports.adminOrderRouter.patch('/:id/status', auth_middleware_1.authenticate, role_middleware_1.requireAdminEmail, order_controller_1.adminUpdateOrderStatus);
// POST   /api/admin/orders/:id/cancel     → force-cancel any order
exports.adminOrderRouter.post('/:id/cancel', auth_middleware_1.authenticate, role_middleware_1.requireAdminEmail, order_controller_1.adminCancelOrder);
exports.default = router;
