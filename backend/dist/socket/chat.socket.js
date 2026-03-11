"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitMessageDeleted = exports.emitNewConversation = exports.emitMessagesDelivered = exports.emitNewMessages = exports.emitNewMessage = exports.registerChatHandlers = void 0;
const ROOM_PREFIX = 'conversation:';
const registerChatHandlers = (io) => {
    io.on('connection', (socket) => {
        socket.on('join_conversation', (payload) => {
            const { conversationId } = payload ?? {};
            if (conversationId) {
                socket.join(`${ROOM_PREFIX}${conversationId}`);
            }
        });
        socket.on('leave_conversation', (payload) => {
            const { conversationId } = payload ?? {};
            if (conversationId) {
                socket.leave(`${ROOM_PREFIX}${conversationId}`);
            }
        });
        socket.on('typing', (payload) => {
            const { conversationId } = payload ?? {};
            const user = socket.data.user;
            if (conversationId && user) {
                socket.to(`${ROOM_PREFIX}${conversationId}`).emit('typing', {
                    conversationId,
                    senderId: user.sub,
                });
            }
        });
        socket.on('stop_typing', (payload) => {
            const { conversationId } = payload ?? {};
            const user = socket.data.user;
            if (conversationId && user) {
                socket.to(`${ROOM_PREFIX}${conversationId}`).emit('stop_typing', {
                    conversationId,
                    senderId: user.sub,
                });
            }
        });
    });
};
exports.registerChatHandlers = registerChatHandlers;
const emitNewMessage = (io, conversationId, message) => {
    io.to(`${ROOM_PREFIX}${conversationId}`).emit('new_message', { message });
};
exports.emitNewMessage = emitNewMessage;
const emitNewMessages = (io, conversationId, messages) => {
    io.to(`${ROOM_PREFIX}${conversationId}`).emit('new_messages', { messages });
};
exports.emitNewMessages = emitNewMessages;
const emitMessagesDelivered = (io, conversationId, messageIds) => {
    io.to(`${ROOM_PREFIX}${conversationId}`).emit('messages_delivered', {
        conversationId,
        messageIds,
    });
};
exports.emitMessagesDelivered = emitMessagesDelivered;
const emitNewConversation = (io, conversation) => {
    io.to('admin_inbox').emit('new_conversation', { conversation });
};
exports.emitNewConversation = emitNewConversation;
const emitMessageDeleted = (io, conversationId, messageId) => {
    io.to(`${ROOM_PREFIX}${conversationId}`).emit('message_deleted', {
        conversationId,
        messageId,
    });
};
exports.emitMessageDeleted = emitMessageDeleted;
