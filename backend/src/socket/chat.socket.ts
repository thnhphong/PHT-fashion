import { Server } from 'socket.io';
import { SocketUser } from './index';

const ROOM_PREFIX = 'conversation:';

export const registerChatHandlers = (io: Server) => {
  io.on('connection', (socket) => {
    socket.on('join_conversation', (payload: { conversationId: string }) => {
      const { conversationId } = payload ?? {};
      if (conversationId) {
        socket.join(`${ROOM_PREFIX}${conversationId}`);
      }
    });

    socket.on('leave_conversation', (payload: { conversationId: string }) => {
      const { conversationId } = payload ?? {};
      if (conversationId) {
        socket.leave(`${ROOM_PREFIX}${conversationId}`);
      }
    });

    socket.on('typing', (payload: { conversationId: string }) => {
      const { conversationId } = payload ?? {};
      const user = socket.data.user as SocketUser;
      if (conversationId && user) {
        socket.to(`${ROOM_PREFIX}${conversationId}`).emit('typing', {
          conversationId,
          senderId: user.sub,
        });
      }
    });

    socket.on('stop_typing', (payload: { conversationId: string }) => {
      const { conversationId } = payload ?? {};
      const user = socket.data.user as SocketUser;
      if (conversationId && user) {
        socket.to(`${ROOM_PREFIX}${conversationId}`).emit('stop_typing', {
          conversationId,
          senderId: user.sub,
        });
      }
    });
  });
};

export const emitNewMessage = (io: Server, conversationId: string, message: object) => {
  io.to(`${ROOM_PREFIX}${conversationId}`).emit('new_message', { message });
};

export const emitNewMessages = (io: Server, conversationId: string, messages: object[]) => {
  io.to(`${ROOM_PREFIX}${conversationId}`).emit('new_messages', { messages });
};

export const emitMessagesDelivered = (
  io: Server,
  conversationId: string,
  messageIds: string[]
) => {
  io.to(`${ROOM_PREFIX}${conversationId}`).emit('messages_delivered', {
    conversationId,
    messageIds,
  });
};

export const emitNewConversation = (io: Server, conversation: object) => {
  io.to('admin_inbox').emit('new_conversation', { conversation });
};

export const emitMessageDeleted = (
  io: Server,
  conversationId: string,
  messageId: string
) => {
  io.to(`${ROOM_PREFIX}${conversationId}`).emit('message_deleted', {
    conversationId,
    messageId,
  });
};
