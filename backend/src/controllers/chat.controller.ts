import { Request, Response } from 'express';
import { Types } from 'mongoose';
import {
  findOrCreateConversation,
  getConversationsForCustomer,
  getConversationById,
  getMessages,
  sendTextMessage,
  sendImageMessage,
  markDelivered,
  deleteMessage,
  getMessageById,
} from '../services/chat.service';
import { uploadImage } from '../config/cloudinary';
import cloudinary from 'cloudinary';
import fs from 'fs';
import { Server } from 'socket.io';
import {
  emitNewMessage,
  emitNewMessages,
  emitMessagesDelivered,
  emitNewConversation,
  emitMessageDeleted,
} from '../socket/chat.socket';

const getSenderRole = (role: string): 'customer' | 'admin' => {
  return role === 'admin' ? 'admin' : 'customer';
};

const getIo = (req: Request): Server | null => {
  return (req.app as any).get?.('io') ?? null;
};

export const createOrGetConversation = async (req: Request, res: Response) => {
  try {
    const customerId = req.user?.sub;
    if (!customerId) return res.status(401).json({ message: 'Unauthorized' });

    const { productId } = req.body ?? {};
    const { conversation, product, isNew } = await findOrCreateConversation(
      customerId,
      productId || undefined
    );

    const io = getIo(req);
    if (io && isNew) {
      emitNewConversation(io, conversation);
    }

    return res.status(isNew ? 201 : 200).json({
      conversationId: conversation._id,
      isNew,
      product: product ?? null,
    });
  } catch (error) {
    console.error('Create conversation error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const listMyConversations = async (req: Request, res: Response) => {
  try {
    const customerId = req.user?.sub;
    if (!customerId) return res.status(401).json({ message: 'Unauthorized' });

    const conversations = await getConversationsForCustomer(customerId);
    return res.status(200).json({ conversations });
  } catch (error) {
    console.error('List conversations error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getConversationMessages = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    const userRole = req.user?.role ?? 'customer';
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const id = req.params.id as string;
    const conv = await getConversationById(id);
    if (!conv) return res.status(404).json({ message: 'Conversation not found' });

    if (userRole !== 'admin' && (conv as { customerId: Types.ObjectId }).customerId.toString() !== userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const limit = Math.min(parseInt(req.query.limit as string) || 30, 50);
    const before = req.query.before as string | undefined;

    const { messages, hasMore, nextCursor } = await getMessages(id, limit, before);
    return res.status(200).json({
      messages,
      hasMore,
      nextCursor: nextCursor?.toString() ?? null,
    });
  } catch (error) {
    console.error('Get messages error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const ensureConversationAccess = async (
  conversationId: string,
  userId: string,
  userRole: string
) => {
  const conv = await getConversationById(conversationId);
  if (!conv) throw new Error('Conversation not found');
  if (userRole !== 'admin' && (conv as { customerId: Types.ObjectId }).customerId.toString() !== userId) {
    throw new Error('Forbidden');
  }
};

export const postTextMessage = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    const userRole = req.user?.role ?? 'customer';
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const id = req.params.id as string;
    await ensureConversationAccess(id, userId, userRole);
    const { content, productCard } = req.body ?? {};

    if (!content || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ message: 'Content is required' });
    }

    const senderRole = getSenderRole(userRole);
    const created = await sendTextMessage(
      id,
      userId,
      senderRole,
      content.trim(),
      productCard
    );

    const lastMsg = created[created.length - 1];
    const io = getIo(req);
    if (io) {
      const serialize = (m: any) => (m && typeof m.toObject === 'function' ? m.toObject() : m);
      if (created.length > 1) {
        emitNewMessages(io, id, created.map(serialize));
      } else {
        emitNewMessage(io, id, serialize(lastMsg));
      }
    }
    return res.status(201).json(
      created.length === 1
        ? lastMsg
        : { messages: created, lastMessage: lastMsg }
    );
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Conversation not found') return res.status(404).json({ message: 'Conversation not found' });
      if (error.message === 'Forbidden') return res.status(403).json({ message: 'Forbidden' });
    }
    console.error('Send message error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const postImageMessage = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    const userRole = req.user?.role ?? 'customer';
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const file = req.file;
    if (!file) return res.status(400).json({ message: 'Image file is required' });

    const id = req.params.id as string;
    await ensureConversationAccess(id, userId, userRole);
    const senderRole = getSenderRole(userRole);

    const uploaded = await uploadImage(file.path, { folder: 'pht_chat' });

    try {
      fs.unlinkSync(file.path);
    } catch {
      // ignore cleanup error
    }

    const msg = await sendImageMessage(
      id,
      userId,
      senderRole,
      uploaded.secure_url,
      uploaded.public_id
    );

    const io = getIo(req);
    if (io) {
      const serialized = msg && typeof (msg as any).toObject === 'function' ? (msg as any).toObject() : msg;
      emitNewMessage(io, id, serialized);
    }

    return res.status(201).json(msg);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Conversation not found') return res.status(404).json({ message: 'Conversation not found' });
      if (error.message === 'Forbidden') return res.status(403).json({ message: 'Forbidden' });
    }
    console.error('Send image error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const patchDelivered = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    const userRole = req.user?.role ?? 'customer';
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const id = req.params.id as string;
    await ensureConversationAccess(id, userId, userRole);

    const { updatedCount, messageIds } = await markDelivered(id, userId, userRole);

    const io = getIo(req);
    if (io && messageIds.length > 0) {
      emitMessagesDelivered(io, id, messageIds);
    }

    return res.status(200).json({ updatedCount, messageIds });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Conversation not found') return res.status(404).json({ message: 'Conversation not found' });
      if (error.message === 'Forbidden') return res.status(403).json({ message: 'Forbidden' });
    }
    console.error('Mark delivered error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteMessageHandler = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    const userRole = req.user?.role ?? 'customer';
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const id = req.params.id as string;
    const messageId = req.params.messageId as string;
    await ensureConversationAccess(id, userId, userRole);

    const msg = await getMessageById(messageId) as { type?: string; imagePublicId?: string } | null;
    if (!msg) return res.status(404).json({ message: 'Message not found' });

    if (msg.type === 'image' && msg.imagePublicId) {
      try {
        await cloudinary.v2.uploader.destroy(msg.imagePublicId);
      } catch (e) {
        console.error('Cloudinary destroy error:', e);
      }
    }

    await deleteMessage(id, messageId, userId, userRole);

    const io = getIo(req);
    if (io) {
      emitMessageDeleted(io, id, messageId);
    }

    return res.status(200).json({ deleted: true });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Message not found') return res.status(404).json({ message: error.message });
      if (error.message === 'Forbidden: not sender or admin') return res.status(403).json({ message: error.message });
      if (error.message.includes('5 minutes')) return res.status(400).json({ message: error.message });
    }
    console.error('Delete message error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

