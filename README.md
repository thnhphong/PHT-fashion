# PHT-Fashion — System Architecture Overview

> MERN stack e-commerce monorepo. Express 5 + MongoDB + Redis backend. React 19 + Vite 7 frontend. Real-time chat via Socket.IO. Payment via PayPal + VNPay.

---

## Table of Contents

1. [Stack](#stack)
2. [Backend Folder Structure](#backend-folder-structure)
3. [Cart — localStorage + Database Sync](#cart--localstorage--database-sync)
4. [Favorites — Immediate DB Persistence](#favorites--immediate-db-persistence)
5. [Product Display & Pagination](#product-display--pagination)
6. [Filtering & Search](#filtering--search)
7. [Chat System](#chat-system)
8. [Order Lifecycle & Overselling Fix](#order-lifecycle--overselling-fix)
9. [Voucher (Coupon) Overselling Fix](#voucher-coupon-overselling-fix)
10. [Pending Orders & Payment Sessions](#pending-orders--payment-sessions)
11. [Redis Caching](#redis-caching)
12. [Microservice Migration Path](#microservice-migration-path)

---

## Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js + TypeScript |
| HTTP Framework | Express 5 |
| Database | MongoDB (Mongoose) |
| Cache / Session store | Redis (`node-redis`) |
| Real-time | Socket.IO |
| Auth | JWT (access 15min + refresh 7d) |
| Payments | PayPal SDK + VNPay |
| Image/Video storage | Cloudinary (via multer) |
| Email | Nodemailer |
| Frontend | React 19 + Vite 7 + TailwindCSS v4 |
| Package manager | pnpm v10 workspaces |

---

## Backend Folder Structure

```
backend/src/
├── index.ts                    # App bootstrap, route mount, Socket.IO init
├── config/
│   ├── env.ts                  # Typed env config
│   └── mongo.config.ts         # Mongoose connection
├── models/                     # Mongoose schemas (single source of truth)
│   ├── Cart.ts                 # One doc per user, embedded items array
│   ├── Conversation.ts         # Chat thread per customer, unread counters
│   ├── Coupon.ts               # Discount codes with atomic count
│   ├── Favorite.ts             # One doc per user, productIds array
│   ├── Message.ts              # Supports text/image/video/product_card types
│   ├── Order.ts                # Final order after payment confirmation
│   ├── OrderItem.ts            # Line items linked to Order
│   ├── PendingPayment.ts       # Payment session (TTL auto-delete via MongoDB)
│   ├── Product.ts              # Catalog with per-size stock
│   ├── RefreshToken.ts         # JWT refresh token rotation
│   └── User.ts
├── routes/                     # Thin Express routers → controllers
├── controllers/                # HTTP layer: parse req, call service, send res
├── services/                   # Business logic (ALL DB + Redis ops live here)
│   ├── cart.service.ts
│   ├── chat.service.ts
│   ├── coupon.service.ts
│   ├── draftOrder.service.ts   # Redis draft + MongoDB transaction + stock reserve
│   ├── favorite.service.ts
│   ├── order.service.ts
│   ├── payment.service.ts
│   ├── pendingPayment.service.ts
│   ├── product.service.ts
│   └── search.service.ts
├── middlewares/                # Auth, role guard, validate, upload
├── socket/
│   ├── index.ts                # Socket.IO server init + JWT auth middleware
│   └── chat.socket.ts          # Room join/leave, typing events, emit helpers
├── utils/
│   ├── api-error.ts            # Typed ApiError class for uniform error responses
│   ├── pagination.ts           # buildPaginationResult() + parsePaginationParams()
│   └── redis.util.ts           # Singleton Redis client with lazy connect
└── validations/                # Zod schemas applied via validateRequest() middleware
```

**Pattern**: `Route → Middleware → Controller → Service → Model`

Controllers handle HTTP only. Services own all DB/Redis logic. This boundary makes services independently testable and future-extractable as microservices.

---

## Cart — localStorage + Database Sync

### How it works

```
Guest user                         Logged-in user
     │                                   │
 localStorage                      MongoDB Cart doc
  [{productId,                    { userId, items: [
    size, qty}]                     {productId, size, qty, addedAt}
                                   ]}
     │                                   │
     └──── Login → POST /api/cart/merge ─┘
```

- **Guest**: items live in `localStorage` on the client. No backend hit.
- **Login**: frontend calls `POST /api/cart/merge` with the guest array. Backend merges into the user's MongoDB `Cart` doc using `Math.max(existing.qty, guest.qty)` to avoid inflating quantities.
- **Authenticated**: every add/remove/update calls the backend directly. `Cart` is one document per user with an embedded `items` array.

### DB Model

`Cart` schema uses a sub-document array (`CartItemSchema` with `_id: false`). One `findOne + save` per mutation — no complex queries needed.

### Key operations

| Endpoint | Service fn | Notes |
|----------|-----------|-------|
| `GET /api/cart` | `getCart()` | Creates empty doc if missing |
| `POST /api/cart/items` | `addItem()` | Increments qty if (productId+size) exists |
| `PUT /api/cart/items` | `updateItem()` | Replaces qty |
| `DELETE /api/cart/items` | `removeItem()` | Filters out matching (productId+size) |
| `POST /api/cart/merge` | `mergeCart()` | Guest-to-user merge on login |
| `DELETE /api/cart` | `clearCart()` | Post-order cleanup |

---

## Favorites — Immediate DB Persistence

### ⚠️ Vital Problem

Unlike cart (which has a guest localStorage buffer), **favorites write to MongoDB immediately on every toggle** — there is no local buffer or debounce. This means:

- If the user spams the heart button, it fires a DB write on every click.
- No optimistic UI rollback if the request fails.
- **Current mitigation**: none at service level. Add debounce on the frontend or idempotency check in `addFavorite`.

### How it works

One `Favorite` doc per user. `productIds` is a plain `ObjectId[]`. Add/remove mutate the array in place.

```
addFavorite(userId, productId)
  → findOne({ userId })
  → push productId if not already present
  → save()
  → return populated doc
```

```
mergeFavorites(userId, productIds[])  // on login — same as cart merge
  → push any guest productIds not already in array
  → save()
```

### ⚠️ Additional Issue: No limit on `productIds` array

As `productIds` grows, `findOne + populate` gets heavier. No max length enforced. Consider capping or paginating favorites.

---

## Product Display & Pagination

### Pagination utility (`utils/pagination.ts`)

All list endpoints share a single helper:

```ts
parsePaginationParams(query)  // parses page, limit (max 100), sort, order
buildPaginationResult(data, total, page, limit)  // returns:
  {
    data: T[],
    pagination: {
      currentPage, totalPages, totalItems,
      itemsPerPage, hasNextPage, hasPrevPage
    }
  }
```

### Product endpoints

| Endpoint | Notes |
|----------|-------|
| `GET /api/products` | General paginated list. Sorted by any field. |
| `GET /api/products/featured` | Same query, intended for homepage section. |
| `GET /api/products/best-sellers` | MongoDB `$lookup` + `$group` aggregation on `OrderItem`. Joins order status to exclude cancelled orders. Re-sorted by totalSold. |
| `GET /api/products/:id` | Single product with `categoryId` + `supplierId` populated. |

### Best-sellers aggregation

```
OrderItem
  → $lookup orders
  → $match { status: { $ne: 'cancelled' } }
  → $group by productId, sum quantity
  → $sort totalSold DESC
  → $skip / $limit
  → hydrate Product docs + re-sort by user-selected field
```

⚠️ **Known issue**: two separate aggregation pipelines run to get both results and count. Could be combined into one `$facet` pipeline.

---

## Filtering & Search

### Capabilities (`search.service.ts`)

| Filter | Implementation |
|--------|---------------|
| Full-text search | MongoDB `$text` index on Product (name + description) |
| Category | Regex case-insensitive match → `categoryId` filter |
| Price range | `$gte / $lte` on `price` |
| Supplier | Regex match → `supplierId` filter |
| Size | `sizes.size` array field match |
| Color | Keyword extraction from name+description (basic, no ML) |
| In-stock only | `stock: { $gt: 0 }` always applied |

### Sort modes

`relevance` (text score), `price-asc`, `price-desc`, `newest`, `name-asc`, `name-desc`

### Filter options endpoint

`GET /api/search/filters` returns available categories, suppliers, sizes, colors, and min/max price range — context-aware (respects active search query and category).

---

## Chat System

### Storage: Two collections

```
Conversation                    Message
────────────────                ────────────────────────────────
_id                             _id
customerId → User               conversationId → Conversation
lastMessage (embedded)          senderId → User
  content (truncated 100ch)     senderRole: 'customer' | 'admin'
  sentAt                        type: 'text'|'image'|'video'|'product_card'
  senderId                      content?
customerUnread: Number          imageUrl? / imagePublicId?
adminUnread: Number             videoUrl? / videoPublicId?
createdAt                       product? (embedded ProductCard snapshot)
updatedAt                       status: 'sent' | 'delivered'
                                createdAt
```

### MongoDB Indexes

```ts
// Conversation
{ customerId: 1 }
{ updatedAt: -1 }
{ customerId: 1, updatedAt: -1 }

// Message
{ conversationId: 1, _id: -1 }      // cursor-based pagination
{ conversationId: 1, createdAt: -1 }
{ senderId: 1 }
```

### Message loading — cursor-based pagination

```
getMessages(conversationId, limit=30, before?)
  → query: { conversationId, _id: { $lt: ObjectId(before) } }
  → sort: _id DESC, limit+1
  → if length > limit → hasMore=true, nextCursor = oldest message _id
  → reverse slice → chronological order
```

Max 50 messages per fetch. Returns `{ messages, hasMore, nextCursor }`.

### Real-time (Socket.IO)

```
Client                        Server (socket/chat.socket.ts)
  join_conversation   ──────→  socket.join('conversation:<id>')
  leave_conversation  ──────→  socket.leave('conversation:<id>')
  typing              ──────→  broadcast to room (excluding sender)
  stop_typing         ──────→  broadcast to room

Server                        Client
  new_message         ──────→  { message }
  new_messages        ──────→  { messages[] }
  messages_delivered  ──────→  { conversationId, messageIds[] }
  message_deleted     ──────→  { conversationId, messageId }
  new_conversation    ──────→  admin_inbox room only
```

Socket connections require a valid JWT. Auth middleware attaches `socket.data.user`.

### ⚠️ Vital Chat Problems

1. **No message read-receipt dedup**: `markDelivered` bulk-updates all `sent` messages from the opposite sender. If called concurrently (e.g. two browser tabs), `updateMany` fires twice — idempotent by status filter but wasteful.

2. **Conversation is 1:1 only**: `findOne({ customerId })` returns one conversation per customer. No multi-topic threads. Admin handles all customers in one inbox.

3. **`lastMessage.content` truncated to 100 chars** at write time — not at read time. Snapshot stored in `Conversation.lastMessage`; if message is deleted, the snapshot updates via a separate query (not atomic). Brief window where `lastMessage` shows deleted content.

4. **Product card `slug` stores `_id` string** (see `chat.service.ts` L53) — not an actual slug. Links to product may break if routing expects a slug field.

5. **No message persistence cap**: messages accumulate indefinitely. Consider a TTL index or archiving policy for old conversations.

---

## Order Lifecycle & Overselling Fix

### Flow

```
1. POST /api/orders/draft
   → reserveStockForItems() inside MongoDB ACID transaction
   → stock decremented atomically per product/size
   → draft JSON stored in Redis with 15min TTL (key: draft_order:<uuid>)
   → returns { draftId, expiresAt, totals }

2. POST /api/payments/paypal/create  (or vnpay/create)
   → reads draft from Redis
   → creates PendingPayment doc in MongoDB (belt-and-suspenders)
   → initiates PayPal/VNPay payment session

3. Payment gateway callback (return URL + IPN/webhook)
   → finalizeDraftOrder(draftId)
   → popDraft() → GETDEL (atomic Redis get+delete — prevents double-finalization)
   → MongoDB transaction:
       - validateAndConsumeCoupon() — atomic $inc count: -1
       - createOrderFromDraft() → Order + OrderItem docs
   → on failure: re-insert draft to Redis with remaining TTL

4. Draft expired (not paid within 15min)
   → cleanupExpiredDrafts() cron scans Redis keys
   → restoreStockForItems() — returns stock to product
   → draft deleted
```

### Why no overselling

Stock reservation uses `findOneAndUpdate` **inside a MongoDB session/transaction**:

```ts
// Filter checks stock AT WRITE TIME, not just at read time
filter = {
  _id: productId,
  sizes: { $elemMatch: { size, stock: { $gte: quantity } } },
  stock: { $gte: quantity }
}
update = { $inc: { 'sizes.$.stock': -quantity, stock: -quantity } }

// If concurrent request already consumed stock → returns null → throws
```

Two concurrent buyers for the last item: MongoDB's WiredTiger serializes writes. First wins; second gets `null` → `Insufficient stock` error.

### Draft idempotency

`createDraftOrder` accepts an optional `idempotencyKey`. If a draft with the same key and `customerId` already exists in Redis, it returns the existing draft — prevents double-reserve on frontend retry.

---

## Voucher (Coupon) Overselling Fix

Coupon consumption is **deferred to finalization**, not draft creation. Reasons:
- Draft can be abandoned (15min window) — don't consume quota for no-shows.
- Expiry re-checked at finalization (coupon could expire during the draft TTL).
- Concurrent IPN + return URL callbacks race → only one wins.

### Atomic consumption

```ts
validateAndConsumeCoupon(code, session)
  → findOneAndUpdate({
      code: UPPERCASE,
      expiration_date: { $gte: now },
      count: { $gt: 0 }         // still has uses
    },
    { $inc: { count: -1 } },    // atomic decrement
    { session }                 // participates in outer transaction
  )
```

Two concurrent calls for the last use: MongoDB serializes → first gets document, second gets `null` → error. Transaction rollback automatically restores the decrement if outer transaction fails.

---

## Pending Orders & Payment Sessions

`PendingPayment` is a MongoDB collection that mirrors the draft for payment gateways that require a server-side record (PayPal, VNPay).

```
PendingPayment fields:
  userId, draftId, paymentMethod
  items[], shippingAddress, shippingMethod
  couponCode?, totalAmount
  status: 'awaiting_payment' | 'completed' | 'expired' | 'cancelled'
  expiresAt                    ← MongoDB TTL index (auto-delete 1h AFTER expiresAt)
  orderId?                     ← set on completion
  paymentId?                   ← gateway payment ID
```

TTL strategy: `expiresAt` index with `expireAfterSeconds: 3600` — MongoDB removes the document 1 hour after `expiresAt`. The 1-hour buffer gives the cleanup job time to mark status as `expired` before the document disappears.

---

## Redis Caching

### What uses Redis

| Use case | Key pattern | TTL |
|----------|-------------|-----|
| Draft orders | `draft_order:<uuid>` | 15min (configurable via `DRAFT_ORDER_TTL_SECONDS`) |

### What does NOT use Redis (yet)

Product listings, search results, and session data are **not cached**. Every product query hits MongoDB directly. This is the primary scaling bottleneck.

### Client implementation (`utils/redis.util.ts`)

Singleton lazy-connect pattern. Client re-initializes on `end` event. `connectRedis()` is idempotent — safe to call before any Redis operation.

```ts
connectRedis()  → connects if not already open
getRedisClient() → throws if not initialized (fail-fast)
disconnectRedis() → graceful shutdown
```

---

## Microservice Migration Path

Current monolith has clean service boundaries — extractable with low risk.

### Recommended split

```
PHT-Fashion Monolith
         │
         ├── product-service          GET /products, /search, /categories
         │     Models: Product, Category, Supplier
         │     Redis: product catalog cache (add this first)
         │
         ├── cart-service             GET/POST/PUT/DELETE /cart
         │     Models: Cart
         │     Depends on: product-service (price validation)
         │
         ├── order-service            POST /orders/draft, finalize
         │     Models: Order, OrderItem, PendingPayment
         │     Redis: draft_order:* keys
         │     Depends on: product-service (stock), coupon-service
         │
         ├── coupon-service           GET/POST /coupons, consume
         │     Models: Coupon
         │
         ├── chat-service             /chat, /admin/chat + Socket.IO
         │     Models: Conversation, Message
         │     Real-time: Socket.IO (needs shared adapter if scaled)
         │
         ├── payment-service          /payments/paypal/*, /payments/vnpay/*
         │     External: PayPal SDK, VNPay
         │     Depends on: order-service
         │
         └── auth-service             /auth, /users
               Models: User, RefreshToken
               Shared: JWT secret
```

### Migration steps

1. **Extract `product-service` first** — no dependencies on other services. Add Redis caching here (product list, category list TTL ~5min). This immediately reduces MongoDB load.
2. **Add a message broker** (e.g. RabbitMQ or Redis Streams). Use it for:
   - `order.completed` → clear cart, send email
   - `draft.expired` → restore stock (replaces in-process cron)
3. **Split `order-service`**. Keep MongoDB transactions local. Communicate with `product-service` via gRPC or REST for stock reservation — or keep stock in order-service's own DB replica.
4. **Chat-service last**: Socket.IO requires a shared adapter (Redis Pub/Sub via `@socket.io/redis-adapter`) when running multiple instances.
5. **API Gateway** (nginx or AWS API Gateway) in front of all services. Route `/api/products` → product-service, `/api/cart` → cart-service, etc.

### Shared concerns to extract early

| Concern | Solution |
|---------|---------|
| Auth token verification | Extract to shared npm package (`@pht/auth`) or run auth-service and validate tokens via middleware in each service |
| Pagination utility | Already in `utils/pagination.ts` — publish as `@pht/pagination` |
| Error format | `ApiError` class → `@pht/errors` |
| Redis client | Shared singleton or per-service connection pool |

---

## Development

```bash
pnpm dev                              # both backend (5000) + frontend (5173)
pnpm --filter backend run dev         # backend only
pnpm --filter frontend run dev        # frontend only
pnpm --filter frontend run build      # production build
```

**Required env** (backend `.env`): `MONGO_URI`, `JWT_SECRET`, `REDIS_URL`

**Optional**: `DRAFT_ORDER_TTL_SECONDS` (default 900), `CLOUDINARY_*`, `EMAIL_*`, `PAYPAL_*`, `VNPAY_*`
