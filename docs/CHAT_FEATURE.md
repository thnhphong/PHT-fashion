# 💬 Chat Feature — Technical Design Document

> **PHT Fashion** · Backend + WebSocket Specification · v1.0 · March 2026

---

## Table of Contents

1. [Overview](#1-overview)
2. [Design Decisions](#2-design-decisions)
3. [Database Schema](#3-database-schema)
4. [REST API](#4-rest-api)
5. [Socket.IO Events](#5-socketio-events)
6. [Image Upload Flow](#6-image-upload-flow)
7. [Message Loading Strategy](#7-message-loading-strategy)
8. [Read Receipts](#8-read-receipts)
9. [Product Card UI Spec](#9-product-card-ui-spec)
10. [Message Deletion](#10-message-deletion)
11. [File Structure](#11-file-structure)
12. [Implementation Checklist](#12-implementation-checklist)

---

## 1. Overview

A Shopee-style real-time chat system between **customers** and **admins** on PHT Fashion.

### User Flows

**Flow A — Chat Now from Product Detail Page**
1. Customer opens a product detail page and clicks **"Chat Now"**
2. Frontend calls `POST /api/chats` with `productId` → server finds or creates a conversation
3. Chat popup opens with a product context card at the top:
   > *"You are communicating with admin about this product"* + product thumbnail, name, price
4. Customer types a message → sent together with the product card as the first message
5. Admin sees the conversation appear in the inbox in real-time

**Flow B — Floating Chat Button**
1. Customer clicks the floating **Chat** button (shows unread badge count)
2. Frontend calls `GET /api/chats` → returns conversation with last message preview & unread count
3. Customer selects conversation → `GET /api/chats/:id/messages?limit=30`
4. Older messages load on scroll-up (cursor-based pagination)

---

## 2. Design Decisions

| Decision | Choice | Reason |
|---|---|---|
| Admin visibility | Any admin can see & reply to **all** conversations | Simple inbox, no assignment logic needed in v1 |
| Image storage | **Cloudinary only** — `secure_url` stored in message doc | Consistent with existing product image pipeline |
| Read receipts | Single tick = `sent` · Double tick = `delivered` | No `seen` status in v1 — keeps schema simple |
| Message pagination | **Cursor-based** (`_id` as cursor) | Avoids slow `skip()` scans on large collections |
| Real-time transport | **Socket.IO** with HTTP long-poll fallback | Works behind proxies; easy room management |
| Socket auth | JWT passed in `socket.handshake.auth.token` | Reuses existing JWT infrastructure |

---

## 3. Database Schema

### 3.1 `conversations` collection

```ts
{
  _id:            ObjectId,
  customerId:     ObjectId,          // ref: users (role: 'customer')

  lastMessage: {
    content:      String,            // preview text or '[Image]'
    sentAt:       Date,
    senderId:     ObjectId,
  },

  customerUnread: Number,            // unread count shown on customer's badge
  adminUnread:    Number,            // unread count shown on admin's inbox

  createdAt:      Date,
  updatedAt:      Date,              // bumped on every new message
}
```

**Indexes:**
```js
{ customerId: 1 }                    // customer's own conversation lookup
{ updatedAt: -1 }                    // admin inbox sorted by latest activity
{ customerId: 1, updatedAt: -1 }     // compound for customer inbox sort
```

---

### 3.2 `messages` collection

```ts
{
  _id:             ObjectId,
  conversationId:  ObjectId,         // ref: conversations
  senderId:        ObjectId,         // ref: users
  senderRole:      'customer' | 'admin',

  type:            'text' | 'image' | 'product_card',

  // type = 'text'
  content?:        String,

  // type = 'image'
  imageUrl?:       String,           // Cloudinary secure_url
  imagePublicId?:  String,           // Cloudinary public_id (for future deletion)

  // type = 'product_card'
  product?: {
    productId:     ObjectId,         // ref: products
    name:          String,           // snapshot at send time
    price:         Number,
    img_url:       String,
    slug:          String,           // for Add to Cart + Buy Now deep-link routing
  },

  status:          'sent' | 'delivered',
  createdAt:       Date,
}
```

**Indexes:**
```js
{ conversationId: 1, _id: -1 }      // PRIMARY — cursor pagination (most critical)
{ conversationId: 1, createdAt: -1 } // fallback date sort
{ senderId: 1 }                      // audit / admin queries
```

> **Note on `product_card` type:** When a customer opens chat from a product page, the first message contains both a `product_card` sub-document (the context card) AND a `content` text. These are stored as **two separate message documents** — the product card first, then the text message — so they render together in the UI exactly as seen in Shopee.

---

## 4. REST API

All endpoints are prefixed with `/api`. Authentication uses the existing `authenticate` + `requireAdminEmail` middleware.

### 4.1 Endpoint Reference

| Method | Path | Description | Auth |
|---|---|---|---|
| `POST` | `/api/chats` | Find or create conversation; optionally attach product | Customer |
| `GET` | `/api/chats` | Customer's conversation list with unread count | Customer |
| `GET` | `/api/chats/:id/messages` | Load messages — cursor-based | Customer / Admin |
| `POST` | `/api/chats/:id/messages` | Send a text message | Customer / Admin |
| `POST` | `/api/chats/:id/messages/image` | Upload image → Cloudinary, persist message | Customer / Admin |
| `PATCH` | `/api/chats/:id/delivered` | Batch-mark received messages as `delivered` | Customer / Admin |
| `GET` | `/api/admin/chats` | Admin inbox — all conversations sorted by activity | Admin |
| `GET` | `/api/admin/chats/:id/messages` | Admin: load messages for any conversation | Admin |

---

### 4.2 Request / Response Contracts

#### `POST /api/chats` — Find or create conversation

```json
// Request body
{
  "productId": "ObjectId | null"
}

// Response 200 (existing) | 201 (new)
{
  "conversationId": "ObjectId",
  "isNew": true,
  "product": {
    "productId": "ObjectId",
    "name": "Đồ chơi súng cà rốt...",
    "price": 25000,
    "img_url": "https://res.cloudinary.com/..."
  }
}
```

---

#### `GET /api/chats` — Customer conversation list

```json
// Response 200
{
  "conversations": [
    {
      "_id": "ObjectId",
      "lastMessage": {
        "content": "cái này bắn mạnh k vậy shop",
        "sentAt": "2026-03-11T13:38:00Z",
        "senderId": "ObjectId"
      },
      "customerUnread": 2,
      "updatedAt": "2026-03-11T13:38:00Z"
    }
  ]
}
```

---

#### `GET /api/chats/:id/messages` — Cursor-based load

**Query parameters:**

| Param | Default | Description |
|---|---|---|
| `limit` | `30` | Max messages per page (hard cap: 50) |
| `before` | *(omit on first load)* | `_id` of the oldest message the client already has |

```json
// Response 200
{
  "messages": [
    {
      "_id": "ObjectId",
      "senderId": "ObjectId",
      "senderRole": "customer",
      "type": "product_card",
      "product": { "productId": "...", "name": "...", "price": 25000, "img_url": "..." },
      "status": "delivered",
      "createdAt": "2026-03-11T13:38:00Z"
    },
    {
      "_id": "ObjectId",
      "type": "text",
      "content": "cái này bắn mạnh k vậy shop",
      "status": "delivered",
      "createdAt": "2026-03-11T13:38:02Z"
    }
  ],
  "hasMore": true,
  "nextCursor": "ObjectId"
}
```

Messages are returned **oldest → newest**. The client passes `nextCursor` as `?before=` on the next scroll-up request.

---

#### `POST /api/chats/:id/messages` — Send text message

```json
// Request body
{
  "content": "cái này bắn mạnh k vậy shop",
  "productCard": {
    "productId": "ObjectId",
    "name": "Đồ chơi súng cà rốt...",
    "price": 25000,
    "img_url": "https://...",
    "slug": "do-choi-sung-ca-rot-vo-tri-in-3d"
  }
}
// productCard is optional — only included on the customer's first message from product page
```

```json
// Response 201
{
  "_id": "ObjectId",
  "type": "text",
  "content": "cái này bắn mạnh k vậy shop",
  "status": "sent",
  "createdAt": "2026-03-11T13:38:02Z"
}
```

When `productCard` is present, the server persists **two messages** in one operation: the `product_card` doc first, then the `text` doc. Both are emitted over Socket.IO as a single `new_messages` array event.

---

#### `POST /api/chats/:id/messages/image` — Send image

- Content-Type: `multipart/form-data`
- Field name: `image` (JPEG / PNG / WEBP, max 5 MB)
- Images are uploaded to Cloudinary folder `pht_chat/`

```json
// Response 201
{
  "_id": "ObjectId",
  "type": "image",
  "imageUrl": "https://res.cloudinary.com/pht/image/upload/pht_chat/abc123.jpg",
  "imagePublicId": "pht_chat/abc123",
  "status": "sent",
  "createdAt": "2026-03-11T13:40:00Z"
}
```

---

#### `PATCH /api/chats/:id/delivered` — Mark delivered

Called by the client immediately after it receives new messages via Socket.IO. Batch-updates all `sent` messages in the conversation (not sent by the caller) to `delivered`, then emits a `messages_delivered` socket event back to the sender.

```json
// Response 200
{ "updatedCount": 3 }
```

---

## 5. Socket.IO Events

### 5.1 Connection & Authentication

```ts
// Client connects with JWT in handshake
const socket = io(SERVER_URL, {
  auth: { token: accessToken }
});

// Server middleware verifies token → attaches user to socket
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  const payload = verifyToken(token); // existing verifyToken util
  socket.data.user = payload;
  next();
});
```

### 5.2 Rooms

Each conversation has its own Socket.IO room: `conversation:<conversationId>`.

- Customer joins on popup open: `socket.join('conversation:<id>')`
- Admin joins when they open a conversation
- All admins also join a shared room `admin_inbox` for new conversation notifications

### 5.3 Event Reference

#### Client → Server (emit)

| Event | Payload | Description |
|---|---|---|
| `join_conversation` | `{ conversationId }` | Join a conversation room |
| `leave_conversation` | `{ conversationId }` | Leave a conversation room |
| `typing` | `{ conversationId }` | Broadcast typing indicator |
| `stop_typing` | `{ conversationId }` | Cancel typing indicator |

#### Server → Client (emit)

| Event | Payload | Description |
|---|---|---|
| `new_message` | `{ message }` | New message arrived in the room |
| `new_messages` | `{ messages[] }` | Array — used when product card + text sent together |
| `messages_delivered` | `{ conversationId, messageIds[] }` | Tick upgrade: sent → delivered |
| `new_conversation` | `{ conversation }` | Emitted to `admin_inbox` room when a new chat starts |
| `typing` | `{ conversationId, senderId }` | Other side is typing |
| `stop_typing` | `{ conversationId, senderId }` | Other side stopped typing |

### 5.4 Send Message Flow (Socket + REST combined)

```
Customer                  Server                     Admin
   │                         │                          │
   │── POST /messages ───────▶│                          │
   │                         │── save to DB             │
   │                         │── emit new_message ──────▶│
   │◀── 201 { status:'sent' }─│                          │
   │                         │                          │
   │                         │◀── PATCH /delivered ─────│
   │                         │── update DB              │
   │◀── emit messages_delivered (✓✓) ──────────────────│
```

---

## 6. Image Upload Flow

```
Client                    Backend                   Cloudinary
  │                          │                          │
  │── POST /messages/image ──▶│                          │
  │   (multipart, image file) │                          │
  │                          │── uploadImage(path) ─────▶│
  │                          │                          │── store file
  │                          │◀── { secure_url, public_id }
  │                          │                          │
  │                          │── save message to DB     │
  │                          │── emit new_message       │
  │◀── 201 { imageUrl } ─────│                          │
```

Reuses the existing `uploadImage()` from `src/config/cloudinary.ts` with `folder: 'pht_chat'`.

```ts
// In the image message controller
const uploaded = await uploadImage(req.file.path, { folder: 'pht_chat' });
const message = await Message.create({
  conversationId: id,
  senderId: req.user.sub,
  senderRole: req.user.role,
  type: 'image',
  imageUrl: uploaded.secure_url,
  imagePublicId: uploaded.public_id,
  status: 'sent',
});
```

---

## 7. Message Loading Strategy

### Why cursor-based over offset?

```
// ❌ Offset — slow on large collections
db.messages.find({ conversationId }).skip(9950).limit(30)
// MongoDB must scan 9950 documents before returning results

// ✅ Cursor — uses index directly, O(log n)
db.messages.find({ conversationId, _id: { $lt: cursorId } })
  .sort({ _id: -1 })
  .limit(30)
```

`ObjectId` is time-prefixed and monotonically increasing, making it a reliable and index-friendly sort key with no duplicate risk when new messages arrive between pagination calls.

### Load sequence

```
1. Initial open  →  GET /messages?limit=30
                    returns last 30 messages + nextCursor

2. Scroll up     →  GET /messages?limit=30&before=<nextCursor>
                    returns next 30 older messages + new nextCursor

3. hasMore=false →  no more requests, show "Start of conversation"
```

### Recommended initial load approach

Load the last **30 messages** on open. This keeps the first paint fast. Do not load the full history upfront — conversations can grow to thousands of messages.

```ts
// Service layer
export const getMessages = async (
  conversationId: string,
  limit = 30,
  before?: string  // ObjectId string
) => {
  const query: any = { conversationId };
  if (before) query._id = { $lt: new Types.ObjectId(before) };

  const messages = await Message.find(query)
    .sort({ _id: -1 })
    .limit(limit + 1)   // fetch one extra to determine hasMore
    .lean();

  const hasMore = messages.length > limit;
  if (hasMore) messages.pop();

  return {
    messages: messages.reverse(), // return oldest → newest
    hasMore,
    nextCursor: hasMore ? messages[0]._id : null,
  };
};
```

---

## 8. Read Receipts

| Status | Trigger | UI |
|---|---|---|
| `sent` | Message saved to MongoDB | Single grey tick ✓ |
| `delivered` | Other client calls `PATCH /delivered` + socket ACK | Double grey tick ✓✓ |

No `seen`/`read` status in v1. The `PATCH /delivered` call is made automatically by the client when it receives messages via socket or on conversation open.

---

## 9. Product Card UI Spec

When a customer opens chat from a product page, the chat popup renders a **product context card** at the top of the conversation. The same card also appears inline as the first message in the history.

### Context banner (top of popup, dismissible)

```
┌─────────────────────────────────────────────────────────┐
│  Bạn đang trao đổi với Admin về sản phẩm này        ✕  │
│  ┌──────────┐  Đồ chơi súng cà rốt vô tri in 3D...     │
│  │  [img]   │  25.000đ                                  │
│  └──────────┘                              [Thay đổi]   │
└─────────────────────────────────────────────────────────┘
```

### Product card message (in chat history)

```
┌──────────────────────────────────────────────────────┐
│  ┌──────────┐  Đồ chơi súng cà rốt vô tri in 3D...  │
│  │  [img]   │  25.000đ                               │
│  └──────────┘                                        │
│  ┌────────────────────┐  ┌────────────────────────┐  │
│  │   🛒  Thêm vào giỏ │  │   ⚡  Mua ngay         │  │
│  └────────────────────┘  └────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

- **Add to Cart** → calls existing `POST /api/cart` with `productId` from the card's `slug`
- **Buy Now** → navigates to `/products/:slug?buyNow=true`
- Both buttons are rendered by the **frontend only** using the `slug` field stored in the message document — no extra backend endpoint needed
- The card is snapshotted at send time (name, price, img_url) so it remains accurate even if the product is later edited

---

## 10. Message Deletion

Messages are **permanently deleted** — no soft-delete / `deletedAt` field.

### Delete endpoint

| Method | Path | Description | Auth |
|---|---|---|---|
| `DELETE` | `/api/chats/:id/messages/:messageId` | Hard-delete a single message | Sender only (within 5 min) or Admin |

### Rules

- A customer can delete their **own** message within **5 minutes** of sending
- An admin can delete **any** message at any time
- Deleting an image message also calls `cloudinary.uploader.destroy(imagePublicId)` to remove the asset
- If the deleted message was the `lastMessage` on the conversation, the server re-queries the previous message and updates `conversations.lastMessage`
- A `message_deleted` Socket.IO event is emitted to the conversation room so all open clients remove it from their UI immediately

```ts
// Socket event payload
{
  event: 'message_deleted',
  conversationId: 'ObjectId',
  messageId: 'ObjectId',
}
```

### Updated API table (additions)

| Method | Path | Description | Auth |
|---|---|---|---|
| `DELETE` | `/api/chats/:id/messages/:messageId` | Permanently delete a message | Sender (≤5 min) / Admin |

---



New files to add inside the existing backend structure:

```
backend/src/
├── models/
│   ├── Conversation.ts        // NEW
│   └── Message.ts             // NEW
│
├── controllers/
│   ├── chat.controller.ts     // NEW — REST handlers
│   └── admin.chat.controller.ts  // NEW — admin inbox handlers
│
├── services/
│   └── chat.service.ts        // NEW — DB logic, pagination, unread counts
│
├── routes/
│   ├── chat.route.ts          // NEW — customer chat routes
│   └── admin.chat.route.ts    // NEW — admin chat routes
│
├── socket/
│   ├── index.ts               // NEW — Socket.IO server init + auth middleware
│   └── chat.socket.ts         // NEW — room join/leave, typing, delivery events
│
└── index.ts                   // EDIT — attach Socket.IO to HTTP server
```

---

## 11. File Structure

New files to add inside the existing backend structure:

```
backend/src/
├── models/
│   ├── Conversation.ts           // NEW
│   └── Message.ts                // NEW
│
├── controllers/
│   ├── chat.controller.ts        // NEW — REST handlers
│   └── admin.chat.controller.ts  // NEW — admin inbox handlers
│
├── services/
│   └── chat.service.ts           // NEW — DB logic, pagination, unread counts
│
├── routes/
│   ├── chat.route.ts             // NEW — customer chat routes
│   └── admin.chat.route.ts       // NEW — admin chat routes
│
├── socket/
│   ├── index.ts                  // NEW — Socket.IO server init + auth middleware
│   └── chat.socket.ts            // NEW — room join/leave, typing, delivery, deletion events
│
└── index.ts                      // EDIT — attach Socket.IO to HTTP server
```

---

## 12. Implementation Checklist

### Backend
- [ ] Create `Conversation` Mongoose model with indexes
- [ ] Create `Message` Mongoose model with indexes (`slug` field in product snapshot)
- [ ] Implement `chat.service.ts` — `findOrCreateConversation`, `getMessages` (cursor), `sendMessage`, `sendProductCard`, `markDelivered`, `deleteMessage`
- [ ] Implement `chat.controller.ts` — all customer endpoints
- [ ] Implement `admin.chat.controller.ts` — admin inbox + message view
- [ ] Register routes in `index.ts`
- [ ] Set up Socket.IO server in `socket/index.ts` with JWT auth middleware
- [ ] Implement room management, delivery events, and `message_deleted` emit in `chat.socket.ts`
- [ ] Image upload route — reuse `uploadImage()` from Cloudinary config with `pht_chat/` folder; enforce 5 MB via multer `limits: { fileSize: 5 * 1024 * 1024 }`
- [ ] Image delete — call `cloudinary.uploader.destroy(imagePublicId)` on message deletion
- [ ] Unread count — increment on message save, reset to 0 on conversation open
- [ ] `DELETE /api/chats/:id/messages/:messageId` — hard delete, 5-minute window for customers, unrestricted for admin
- [ ] Re-query and update `conversations.lastMessage` after a message is deleted
- [ ] No admin email/push notification needed — socket only

### Frontend (reference)
- [ ] "Chat Now" button on product detail → `POST /api/chats` → open popup with product context banner
- [ ] Product card message renders **Add to Cart** + **Buy Now** buttons using stored `slug`
- [ ] Floating Chat button shows `customerUnread` badge from conversation list
- [ ] On conversation open → `PATCH /delivered` immediately to flip ticks
- [ ] Scroll-up handler → fetch next page with `?before=<nextCursor>`
- [ ] Listen for `message_deleted` socket event → remove message from local state instantly

### Answered decisions (from session 2)

| Question | Answer |
|---|---|
| Admin push notification on new conversation? | **No** — admin inbox updates via Socket.IO `new_conversation` event only |
| Old message deletion? | **soft-delete **
| Max image file size? | **5 MB confirmed** — enforce on both client (before upload) and server (multer limit) |
| Product card CTA buttons? | **Yes** — product card inside the chat popup shows **Add to Cart icon** + **Buy Now** buttons |

---

*PHT Fashion — Internal Draft — Not for distribution*