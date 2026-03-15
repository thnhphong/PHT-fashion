# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PHT-Fashion is a monorepo MERN stack e-commerce application using pnpm workspaces (`backend/` and `frontend/`).

- **Backend**: Express 5 + TypeScript + MongoDB (Mongoose) + Redis, running on port 5000
- **Frontend**: React 19 + Vite 7 + TypeScript + TailwindCSS v4, running on port 5173
- **Package manager**: pnpm (v10.28.1) with workspace protocol

## Development Commands

```bash
# Run both backend and frontend concurrently
pnpm dev

# Run individually
pnpm --filter backend run dev     # ts-node-dev with --respawn
pnpm --filter frontend run dev    # Vite dev server

# Build
pnpm --filter frontend run build  # tsc -b && vite build
pnpm --filter backend run build   # tsc → outputs to backend/dist/

# Lint (frontend only)
pnpm --filter frontend run lint   # ESLint with typescript-eslint + react-hooks + react-refresh
```

No test runner is configured. Validation is done via Zod schemas on the backend.

## Architecture

### Backend: Route → Middleware → Controller → Service → Model

- Routes mount at `/api/*` in `backend/src/index.ts`. Admin routes share the same controllers but are also mounted at `/api/admin/*`.
- Controllers handle HTTP concerns (req/res, status codes). Services contain business logic and DB calls.
- Validation uses Zod schemas in `backend/src/validations/`, applied via `validateRequest(schema)` middleware.
- Custom `ApiError` class in `backend/src/utils/api-error.ts` for typed error responses.
- All Mongoose models disable version key (`{ versionKey: false }`) and use `IModelName extends Document` interfaces.

### Backend Auth

- JWT with access token (15min) + refresh token (7 days). Token payload: `{ sub: userId, role: 'customer'|'admin' }`.
- `auth.middleware.ts` verifies tokens and attaches `req.user`. `role.middleware.ts` handles role-based access via `authorize()`.
- Refresh tokens stored in MongoDB (`RefreshToken` model) and rotated on use.

### Backend Integrations

- **Cloudinary** for image uploads (via multer + cloudinary SDK)
- **Nodemailer** for emails (password reset, notifications)
- **PayPal + VNPay** for payment processing
- **Redis** for caching
- **Socket.IO** for real-time chat (`backend/src/socket/`)

### Frontend Structure

- **Routing**: React Router v7 (`BrowserRouter`). Public routes use a shared `Layout` component (with `CartPopup`, `ChatPopup`, `FloatingChatButton`). Admin routes are protected by `AdminRoute` guard at `/admin/*`.
- **State management**: React Context API — `CartContext`, `FavoriteContext`, `ChatContext`. Auth state is token-based via `localStorage` (`utils/auth.ts`).
- **API calls**: `apiUrl(path)` from `utils/api.ts` builds URLs from `VITE_API_URL` env var. Access tokens sent as `Authorization: Bearer` headers. Token refresh handled in `utils/auth.ts`.
- **UI**: TailwindCSS v4 + shadcn/ui (new-york style, `@/components/ui/`). Icons via lucide-react. Animations via framer-motion.
- **Path alias**: `@/` maps to `frontend/src/` (configured in both tsconfig and vite.config.ts).
- **Types**: Shared type definitions in `frontend/src/types/types.ts`.
- **Styling tokens**: Design colors in `styles/colors.ts`, fonts in `styles/fonts.ts`.

### Vite Dev Proxy

The frontend proxies `/api` requests to `http://localhost:5000` with path rewriting (strips `/api` prefix), so the backend sees requests at root.

## Adding a New API Endpoint

1. Define Zod validation schema in `backend/src/validations/{feature}.validation.ts`
2. Create service methods in `backend/src/services/{feature}.service.ts`
3. Create controller in `backend/src/controllers/{feature}.controller.ts`
4. Create route file in `backend/src/routes/{feature}.route.ts` with `validateRequest(schema)` middleware
5. Mount route in `backend/src/index.ts`

## Environment Variables

**Backend** (`.env`, see `.env.example`): `MONGO_URI`, `JWT_SECRET` (required); `PORT`, `CLOUDINARY_*`, `EMAIL_*`, `FRONTEND_URL` (optional).

**Frontend** (`.env` in `frontend/src/`): `VITE_API_URL` (defaults to `http://localhost:5001` if unset).

## Deployment

Frontend deployed on Vercel (SPA mode with `vercel.json` rewrites). Backend deployed separately.
