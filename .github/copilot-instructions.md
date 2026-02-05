# PHT-Fashion Copilot Instructions

## Project Overview
**PHT-Fashion** is a monorepo MERN stack e-commerce application with pnpm workspaces.
- **Backend**: Node.js/Express/TypeScript with MongoDB
- **Frontend**: React 19/Vite with TailwindCSS and React Router
- **Architecture**: Service → Controller → Route pattern; Context API for state management

## Development Commands
```bash
# Root (runs both backend and frontend in parallel)
pnpm dev

# Individual services
pnpm --filter backend run dev    # Port 5000
pnpm --filter frontend run dev   # Port 5173 (Vite dev server)

# Build
pnpm --filter frontend run build
```

## Backend Architecture

### Core Patterns
1. **Routing Structure** ([backend/src/routes/](backend/src/routes/))
   - Each feature has dedicated route file: `auth.route.ts`, `product.route.ts`, etc.
   - All routes mounted at `/api/*` in [index.ts](backend/src/index.ts)
   - Admin routes use `/api/admin/*` prefix for protected CRUD operations

2. **Request Flow**: Route → Middleware → Controller → Service → Model
   - Controllers handle HTTP (request/response, status codes)
   - Services contain business logic and database interactions
   - Middleware handles auth, validation, error handling

3. **Error Handling**
   - Custom [ApiError](backend/src/utils/api-error.ts) class for typed errors
   - Request validation uses Zod schemas ([validations/](backend/src/validations/))
   - Validation middleware: `validateRequest(schema)` catches ZodErrors and formats responses

### Key Implementations

**Authentication** ([auth.service.ts](backend/src/services/auth.service.ts), [jwt.ts](backend/src/config/jwt.ts))
- Access token: 15 minutes; Refresh token: 7 days; Reset token: 10 minutes
- Token payload: `{ sub: userId, role: 'customer'|'admin' }`
- Auth middleware adds `req.user` to Express Request interface
- Role-based access via `authorize()` middleware

**Request Validation** ([validateRequest.ts](backend/src/middlewares/validateRequest.ts))
- All schemas defined in [validations/](backend/src/validations/) using Zod
- Apply middleware: `validateRequest(schema)` on routes
- Error format: `{ message: 'Validation failed', errors: [{field, message}] }`

**Database Models** ([models/](backend/src/models/))
- MongoDB via Mongoose with TypeScript interfaces (e.g., `IUser extends Document`)
- All models disable version key: `{ versionKey: false }`
- User roles hardcoded to `'customer'` or `'admin'`

### Configuration Files
- [env.ts](backend/src/config/env.ts): Required vars `MONGO_URI`, `JWT_SECRET`; optional `JWT_EXPIRES`, `PORT`
- [mongo.config.ts](backend/src/config/mongo.config.ts): Connection handling
- [cloudinary.ts](backend/src/config/cloudinary.ts): Image upload service

## Frontend Architecture

### State Management & API
- **Auth**: [AuthContext.tsx](frontend/src/context/AuthContext.tsx) (WIP - currently empty)
- **Cart**: [CartContext.tsx](frontend/src/context/CartContext.tsx)
- **Favorites**: [FavoriteContext.tsx](frontend/src/context/FavoriteContext.tsx)
- **HTTP Client**: [utils/api.ts](frontend/src/utils/api.ts) constructs API URLs from `VITE_API_URL` env var

### Routing & Pages
- React Router v7 for navigation
- Page structure: [pages/](frontend/src/pages/) contains Home, Login, Signup, Product, Admin
- Admin dashboard nested in [pages/admin/](frontend/src/admin/) with sub-routes for product/category/coupon management

### Styling & UI
- TailwindCSS + PostCSS for styling
- Component structure: [components/](frontend/src/components/) organized by feature (buttons, layout, errors, logo)
- Colors and fonts defined in [styles/](frontend/src/styles/) (colors.ts, fonts.ts)

### Data Types
- Central type definitions in [types/types.ts](frontend/src/types/types.ts)
- Utility: [formatPrice.ts](frontend/src/utils/formatPrice.ts) for display formatting

## Key Developer Workflows

### Adding a New API Endpoint
1. Create route handler in `controllers/{feature}.controller.ts`
2. Add service methods in `services/{feature}.service.ts`
3. Define validation schema in `validations/{feature}.validation.ts` using Zod
4. Create/update route file in `routes/{feature}.route.ts` with `validateRequest(schema)` middleware
5. Mount route in [backend/src/index.ts](backend/src/index.ts)

### Modifying Authentication
- Token payload lives in [jwt.ts](backend/src/config/jwt.ts) (expires, sign/verify functions)
- Auth middleware in [auth.middleware.ts](backend/src/middlewares/auth.middleware.ts)
- Controller logic in [auth.controller.ts](backend/src/controllers/auth.controller.ts)

### Frontend API Calls
- Import `apiUrl()` from [utils/api.ts](frontend/src/utils/api.ts) to build endpoint URLs
- Store auth tokens in context after login
- Attach tokens to requests as `Authorization: Bearer {token}` header

## Integration Points
- **Cloudinary**: Image uploads configured in [config/cloudinary.ts](backend/src/config/cloudinary.ts)
- **Email Service**: [email.service.ts](backend/src/services/email.service.ts) for password reset, notifications
- **Payment**: [payment.service.ts](backend/src/services/payment.service.ts) for order processing
- **CORS**: Frontend localhost:5173 whitelisted; includes credentials and Authorization header

## Cross-Cutting Concerns
- **Pagination**: Utility in [utils/pagination.ts](backend/src/utils/pagination.ts)
- **Timestamps**: All models use `created_at` field, formatted consistently
- **User Role System**: Two roles only (`'customer'`, `'admin'`) checked via middleware
- **Password Security**: bcryptjs with salt rounds in auth controller and service

## Environment Setup
**Backend** (.env required):
```
MONGO_URI=mongodb://...
JWT_SECRET=your_secret_key
PORT=5000
CLOUDINARY_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

**Frontend** (.env.local optional):
```
VITE_API_URL=http://localhost:5000/api
```

## Testing & Validation
- No Jest/test runners configured; manual testing via API
- Validation is first line of defense using Zod schemas
- Error responses always structured: `{ message: string, errors?: [...] }`
