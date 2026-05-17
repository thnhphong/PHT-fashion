# Auth And Payments

Load for login, token, checkout, order, VNPay, or PayPal work.

## Auth Files

- Backend JWT config: `backend/src/config/jwt.ts`
- Backend auth service: `backend/src/services/auth.service.ts`
- Backend auth controller: `backend/src/controllers/auth.controller.ts`
- Backend auth middleware: `backend/src/middlewares/auth.middleware.ts`
- Frontend auth helpers: `frontend/src/utils/auth.ts`
- Frontend auth context: `frontend/src/context/AuthContext.tsx`

## Token Caution

The codebase has comments about httpOnly cookies and helpers that read token state in the browser. Check actual implementation before changing assumptions.

## Payments And Orders

- Payment service: `backend/src/services/payment.service.ts`
- Pending payments: `backend/src/services/pendingPayment.service.ts`
- Draft orders: `backend/src/services/draftOrder.service.ts`
- Orders: `backend/src/services/order.service.ts`
- Checkout page: `frontend/src/pages/Checkout.tsx`
- Orders page: `frontend/src/pages/Orders.tsx`

## Validation

Run backend build after payment/order/auth changes. Frontend checkout changes also need frontend build.
