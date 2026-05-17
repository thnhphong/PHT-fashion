# Plan: Hybrid Cart & Favorites Storage System

## Context

Cart and favorites use a **hybrid system**: both guest and logged-in users use `localStorage` while browsing. Data is synced to MongoDB **only on logout** (and merged from DB on login).

## Scope

### Backend — New Files

1. **`backend/src/models/Cart.ts`** — Mongoose model
   - `userId` (ObjectId, ref User, unique index), `items[]` (`productId`, `size`, `quantity`, `addedAt`), `updatedAt`

2. **`backend/src/validations/cart.validation.ts`** — Zod schemas for add/update/merge

3. **`backend/src/services/cart.service.ts`** — Business logic
   - `getCart(userId)` — populate product info (name, price, img_url, stock, sizes)
   - `addItem(userId, {productId, size, quantity})`
   - `updateItem(userId, productId, size, quantity)`
   - `removeItem(userId, productId, size)`
   - `clearCart(userId)`
   - `mergeCart(userId, guestItems[])` — same productId+size → keep higher quantity

4. **`backend/src/controllers/cart.controller.ts`** — HTTP handlers using `req.user.sub`

5. **`backend/src/routes/cart.route.ts`** — All routes behind `authenticate` middleware
   - `GET /api/cart`
   - `POST /api/cart/items`
   - `PATCH /api/cart/items/:productId` (size in body)
   - `DELETE /api/cart/items/:productId` (size in query/body)
   - `DELETE /api/cart`
   - `POST /api/cart/merge`

6. **`backend/src/validations/favorite.validation.ts`** — Zod schemas for merge

7. **`backend/src/services/favorite.service.ts`** — Business logic
   - `getFavorites(userId)` — populate product info
   - `addFavorite(userId, productId)`
   - `removeFavorite(userId, productId)`
   - `mergeFavorites(userId, productIds[])` — union

8. **`backend/src/controllers/favorite.controller.ts`** — HTTP handlers

9. **`backend/src/routes/favorite.route.ts`** — All routes behind `authenticate`
   - `GET /api/favorites`
   - `POST /api/favorites/:productId`
   - `DELETE /api/favorites/:productId`
   - `POST /api/favorites/merge`

### Backend — Modified Files

10. **`backend/src/index.ts`** — Mount new routes:
    ```
    app.use('/api/cart', cartRoutes);
    app.use('/api/favorites', favoriteRoutes);
    ```

11. **`backend/src/models/Order.ts`** — Make `customerId` optional (allow `null` for guest checkout)

12. **`backend/src/controllers/order.controller.ts`** — Add `createGuestOrder` handler

13. **`backend/src/routes/order.route.ts`** — Add `POST /api/orders/guest` (no auth)

### Frontend — Modified Files

14. **`frontend/src/context/CartContext.tsx`** — Hybrid storage:
    - **Browsing**: Both guest and logged-in use `localStorage` only (no API calls on add/remove/update)
    - **On login**: Fetch from DB, merge with localStorage, set state
    - **On logout**: `syncCartToDbOnLogout()` — POST /cart/merge (or DELETE if empty) before clearing tokens

15. **`frontend/src/context/FavoriteContext.tsx`** + **`favoriteStore.ts`** — Same pattern:
    - **Browsing**: localStorage only
    - **On login**: Fetch from DB, merge with localStorage
    - **On logout**: `syncFavoritesToDbOnLogout()` — POST /favorites/merge

16. **`frontend/src/pages/Login.tsx`** — After successful login:
    - Read `pht_cart` and `pht_favorites` from localStorage
    - Check `pht_guest_session_at` TTL (24h)
    - If expired → discard guest data
    - If valid and both guest+DB carts non-empty → show conflict dialog
    - If valid and no conflict → merge silently via `POST /api/cart/merge`
    - Clear localStorage keys after merge

17. **`frontend/src/utils/auth.ts`** — `logOut()` clears tokens and localStorage. **Navbar** calls `syncCartToDbOnLogout` and `syncFavoritesToDbOnLogout` *before* `logOut()`.

18. **`frontend/src/components/CartMergeDialog.tsx`** — New conflict dialog component:
    - "Keep previous items" → POST merge
    - "Start fresh" → discard guest cart
    - Only shown when guest cart AND DB cart are both non-empty

19. **`frontend/src/types/types.ts`** — Add cart/favorite API response types

## Implementation Order

1. Backend models + validations (Cart model, Zod schemas)
2. Backend services (cart.service, favorite.service)
3. Backend controllers + routes + mount in index.ts
4. Guest checkout endpoint (Order model change + controller + route)
5. Frontend CartContext rewrite (hybrid store)
6. Frontend FavoriteContext rewrite (hybrid store)
7. Login merge flow + conflict dialog
8. Logout cleanup in auth.ts

## Key Patterns to Follow

- **Controllers**: `req.user?.sub` for userId, try/catch with `res.status().json()` (see `order.controller.ts`)
- **Validation**: Zod schemas + `validateRequest(schema)` middleware (see `auth.validation.ts`, `validateRequest.ts`)
- **Auth middleware**: `authenticate` from `backend/src/middlewares/auth.middleware.ts`
- **API calls frontend**: `apiUrl('/cart')` + `Authorization: Bearer ${getAccessToken()}`
- **Existing Favorite model** at `backend/src/models/Favorite.ts` already has the right shape — reuse it

## Verification

1. Start backend: `pnpm --filter backend run dev`
2. Start frontend: `pnpm --filter frontend run dev`
3. Test guest flow: add items to cart/favorites → verify localStorage keys (no API calls)
4. Test login merge: login → fetch from DB, merge with localStorage
5. Test logged-in browsing: add/remove items → verify no API calls, only localStorage
6. Test logout: verify sync APIs called (merge cart/fav to DB), then localStorage cleared
7. Test next login: verify cart/favorites restored from DB
8. Test guest session TTL: set `pht_guest_session_at` to >24h ago → localStorage cleared
