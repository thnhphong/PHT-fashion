# Chat Feature — Implementation Summary

## Backend Completed

### 1. Dependencies
- **socket.io** added to `backend/package.json`
- Run `pnpm install` in backend to install

### 2. Models
- **Conversation** (`backend/src/models/Conversation.ts`) — customerId, lastMessage, customerUnread, adminUnread
- **Message** (`backend/src/models/Message.ts`) — text, image, product_card types with indexes

### 3. REST API Endpoints

| Method | Path | Description | Auth |
|--------|------|--------------|------|
| `POST` | `/api/chats` | Find or create conversation; body: `{ productId? }` | Customer |
| `GET` | `/api/chats` | Customer's conversation list with unread | Customer |
| `GET` | `/api/chats/:id/messages` | Load messages; query: `?limit=30&before=<cursor>` | Customer/Admin |
| `POST` | `/api/chats/:id/messages` | Send text; body: `{ content, productCard? }` | Customer/Admin |
| `POST` | `/api/chats/:id/messages/image` | Upload image (multipart, field: `image`, max 5MB) | Customer/Admin |
| `PATCH` | `/api/chats/:id/delivered` | Mark received messages as delivered | Customer/Admin |
| `DELETE` | `/api/chats/:id/messages/:messageId` | Delete message (sender ≤5 min or admin) | Customer/Admin |
| `GET` | `/api/admin/chats` | Admin inbox — all conversations | Admin |
| `GET` | `/api/admin/chats/:id/messages` | Admin: load messages for any conversation | Admin |

### 4. Socket.IO
- **Auth**: JWT in `socket.handshake.auth.token`
- **Rooms**: `conversation:<id>`, `admin_inbox` (admins auto-join)
- **Events**: `join_conversation`, `leave_conversation`, `typing`, `stop_typing`
- **Server emits**: `new_message`, `new_messages`, `messages_delivered`, `new_conversation`, `message_deleted`

### 5. File Structure
```
backend/src/
├── models/Conversation.ts
├── models/Message.ts
├── services/chat.service.ts
├── controllers/chat.controller.ts
├── controllers/admin.chat.controller.ts
├── routes/chat.route.ts
├── routes/admin.chat.route.ts
├── socket/index.ts
└── socket/chat.socket.ts
```

---

## Frontend Components Needed

To complete the chat feature, you will need these UI components:

### 1. **Floating Chat Button**
- Shows unread badge count (from `GET /api/chats` → sum of `customerUnread`)
- Opens chat popup on click
- Position: bottom-right (e.g. fixed)

### 2. **Chat Popup / Drawer**
- List of conversations (from `GET /api/chats`)
- Click conversation → load messages (`GET /api/chats/:id/messages`)
- Input area for text + image upload
- Scroll-up to load older messages (`?before=<nextCursor>`)

### 3. **Product Context Banner** (when opened from product page)
- "Bạn đang trao đổi với Admin về sản phẩm này"
- Product thumbnail, name, price
- Dismissible (✕)
- "Thay đổi" link to switch product

### 4. **Product Card Message**
- Renders when `message.type === 'product_card'`
- Shows product image, name, price
- **Add to Cart** → `POST /api/cart` with productId
- **Buy Now** → navigate to `/product/:id?buyNow=true`

### 5. **Message List**
- Renders text, image, product_card messages
- Single tick = sent, double tick = delivered
- Delete button (if sender and within 5 min, or admin)

### 6. **Socket.IO Client**
- Connect with `io(url, { auth: { token: accessToken } })`
- On open conversation: `emit('join_conversation', { conversationId })`
- On close: `emit('leave_conversation', { conversationId })`
- Listen: `new_message`, `new_messages`, `messages_delivered`, `message_deleted`
- On receive messages: call `PATCH /api/chats/:id/delivered`

### 7. **"Chat Now" Button on Product Detail**
- On click: `POST /api/chats` with `{ productId }`
- Open chat popup with product context banner
- First message can include `productCard` in body

---

## Environment
- Ensure `uploads/` exists (created automatically; add `backend/uploads/` to .gitignore)
- Cloudinary env vars for image upload
- Socket.IO uses same port as API (e.g. `http://localhost:5001`)

---

## Next Steps
1. Install: `cd backend && pnpm install`
2. Run backend: `pnpm run dev`
3. Build frontend components (see list above)
4. Install `socket.io-client` in frontend: `pnpm add socket.io-client`
