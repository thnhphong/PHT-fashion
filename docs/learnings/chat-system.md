# Chat System

Load for chat work.

## Backend

- Service: `backend/src/services/chat.service.ts`
- Controllers: `backend/src/controllers/chat.controller.ts`, `backend/src/controllers/admin.chat.controller.ts`
- Routes: `backend/src/routes/chat.route.ts`, `backend/src/routes/admin.chat.route.ts`
- Socket: `backend/src/socket/index.ts`, `backend/src/socket/chat.socket.ts`
- Models: `backend/src/models/Conversation.ts`, `backend/src/models/Message.ts`

## Frontend

- Context: `frontend/src/context/ChatContext.tsx`
- Popup: `frontend/src/components/chat/ChatPopup.tsx`
- Floating button: `frontend/src/components/chat/FloatingChatButton.tsx`
- Product context: `frontend/src/components/chat/ProductContextBanner.tsx`, `ProductCardMessage.tsx`

## Long Specs

Load only when needed:

- `docs/CHAT_FEATURE.md`
- `docs/CHAT_IMPLEMENTATION_SUMMARY.md`

## Common Checks

Verify REST flow and Socket.IO flow together. Auth token handling affects both.
