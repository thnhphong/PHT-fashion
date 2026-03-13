import { Request, Response } from 'express';
import { getAdminConversations, getMessages } from '../services/chat.service';

export const adminListConversations = async (req: Request, res: Response) => {
  try {
    const conversations = await getAdminConversations();
    return res.status(200).json({ conversations });
  } catch (error) {
    console.error('Admin list conversations error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const adminGetConversationMessages = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const limit = Math.min(parseInt(req.query.limit as string) || 30, 50);
    const before = req.query.before as string | undefined;

    const { messages, hasMore, nextCursor } = await getMessages(id, limit, before);
    return res.status(200).json({
      messages,
      hasMore,
      nextCursor: nextCursor?.toString() ?? null,
    });
  } catch (error) {
    console.error('Admin get messages error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
