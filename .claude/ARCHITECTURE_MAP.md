# Architecture Map

Fast map for finding code without loading the full repository.

## Root

- `package.json`: workspace scripts.
- `pnpm-workspace.yaml`: workspace membership.
- `CLAUDE.md`: token-efficient agent entrypoint.
- `.claude/`: small startup docs and workflow docs.
- `docs/`: task-specific docs and historical feature notes.

## Backend

Path: `backend/src/`

- `index.ts`: app bootstrap, route mounting, Socket.IO init.
- `routes/`: Express routers.
- `controllers/`: HTTP request/response layer.
- `services/`: business logic, DB calls, Redis calls.
- `models/`: Mongoose schemas.
- `validations/`: Zod request schemas.
- `middlewares/`: auth, role, validation, error handling.
- `socket/`: Socket.IO auth and chat events.
- `config/`: env, MongoDB, Cloudinary, VNPay, JWT config.
- `utils/`: API errors, pagination, Redis singleton, currency helpers.

Pattern: route -> middleware -> controller -> service -> model.

## Frontend

Path: `frontend/src/`

- `main.tsx`: React entry.
- `App.tsx`: route registration.
- `pages/`: route pages, including `pages/admin/`.
- `components/`: shared UI, layout, chat, admin charts, common widgets.
- `components/ui/`: shadcn-style UI primitives.
- `context/`: cart, favorite, auth, chat state.
- `utils/`: API, auth, formatting, add-to-cart helpers.
- `styles/`: color and font tokens.
- `types/`: shared TypeScript types.

## Feature Lookup

- Products: `backend/src/services/product.service.ts`, `frontend/src/pages/Products.tsx`, `frontend/src/pages/ProductDetail.tsx`.
- Cart: `backend/src/services/cart.service.ts`, `frontend/src/context/CartContext.tsx`, `frontend/src/pages/Cart.tsx`.
- Favorites: `backend/src/services/favorite.service.ts`, `frontend/src/context/FavoriteContext.tsx`.
- Orders/payments: `backend/src/services/order.service.ts`, `backend/src/services/payment.service.ts`, `frontend/src/pages/Checkout.tsx`, `frontend/src/pages/Orders.tsx`.
- Chat: `backend/src/services/chat.service.ts`, `backend/src/socket/`, `frontend/src/context/ChatContext.tsx`, `frontend/src/components/chat/`.
- Admin analytics: `backend/src/services/admin.analytics.service.ts`, `frontend/src/pages/admin/AdminAnalytics.tsx`.
