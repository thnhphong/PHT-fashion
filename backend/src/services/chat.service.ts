import { Types } from 'mongoose';
import Conversation, { IConversation } from '../models/Conversation';
import Message, { IMessage } from '../models/Message';
import Product from '../models/Product';

const MESSAGE_LIMIT_MAX = 50;
const MESSAGE_LIMIT_DEFAULT = 30;
const CUSTOMER_DELETE_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

export interface ProductCardInput {
  productId: string;
  name: string;
  price: number;
  img_url: string;
  slug: string;
}

export const findOrCreateConversation = async (
  customerId: string,
  productId?: string
): Promise<{ conversation: IConversation; product?: ProductCardInput; isNew: boolean }> => {
  let conversation = await Conversation.findOne({ customerId: new Types.ObjectId(customerId) })
    .sort({ updatedAt: -1 })
    .lean();

  const isNew = !conversation;

  if (!conversation) {
    const [newConv] = await Conversation.create([
      {
        customerId: new Types.ObjectId(customerId),
        lastMessage: {
          content: 'Conversation started',
          sentAt: new Date(),
          senderId: new Types.ObjectId(customerId),
        },
        customerUnread: 0,
        adminUnread: 0,
      },
    ]);
    conversation = newConv.toObject();
  }

  let product: ProductCardInput | undefined;
  if (productId) {
    const p = await Product.findById(productId).select('name price img_url').lean();
    if (p) {
      product = {
        productId: p._id.toString(),
        name: p.name,
        price: p.price,
        img_url: p.img_url,
        slug: p._id.toString() as string,
      };
    }
  }

  return {
    conversation: conversation as IConversation,
    product,
    isNew,
  };
};

export const getConversationsForCustomer = async (customerId: string) => {
  const conversations = await Conversation.find({ customerId: new Types.ObjectId(customerId) })
    .sort({ updatedAt: -1 })
    .lean();

  return conversations.map((c) => ({
    _id: c._id,
    lastMessage: c.lastMessage,
    customerUnread: c.customerUnread,
    updatedAt: c.updatedAt,
  }));
};

export const getAdminConversations = async () => {
  return Conversation.find()
    .populate('customerId', 'name email')
    .sort({ updatedAt: -1 })
    .lean();
};

export const getConversationById = async (conversationId: string) => {
  return Conversation.findById(conversationId).lean();
};

export const getMessages = async (
  conversationId: string,
  limit = MESSAGE_LIMIT_DEFAULT,
  before?: string
): Promise<{
  messages: IMessage[];
  hasMore: boolean;
  nextCursor: Types.ObjectId | null;
}> => {
  const cappedLimit = Math.min(limit, MESSAGE_LIMIT_MAX);
  const query: Record<string, unknown> = { conversationId: new Types.ObjectId(conversationId) };

  if (before) {
    query._id = { $lt: new Types.ObjectId(before) };
  }

  const messages = await Message.find(query)
    .sort({ _id: -1 })
    .limit(cappedLimit + 1)
    .lean();

  const hasMore = messages.length > cappedLimit;
  const slice = hasMore ? messages.slice(0, cappedLimit) : messages;
  const reversed = slice.reverse();

  return {
    messages: reversed as IMessage[],
    hasMore,
    nextCursor: hasMore ? (slice[0] as { _id: Types.ObjectId })._id : null,
  };
};

export const sendTextMessage = async (
  conversationId: string,
  senderId: string,
  senderRole: 'customer' | 'admin',
  content: string,
  productCard?: ProductCardInput
): Promise<IMessage[]> => {
  const conv = await Conversation.findById(conversationId);
  if (!conv) throw new Error('Conversation not found');

  const senderObjId = new Types.ObjectId(senderId);
  const convObjId = new Types.ObjectId(conversationId);
  const now = new Date();

  const lastContent = content.length > 100 ? content.slice(0, 97) + '...' : content;

  const created: IMessage[] = [];

  if (productCard) {
    const [productCardMsg] = await Message.create([
      {
        conversationId: convObjId,
        senderId: senderObjId,
        senderRole,
        type: 'product_card',
        product: {
          productId: new Types.ObjectId(productCard.productId),
          name: productCard.name,
          price: productCard.price,
          img_url: productCard.img_url,
          slug: productCard.slug,
        },
        status: 'sent',
        createdAt: now,
      },
    ]);
    created.push(productCardMsg);
  }

  const [textMsg] = await Message.create([
    {
      conversationId: convObjId,
      senderId: senderObjId,
      senderRole,
      type: 'text',
      content,
      status: 'sent',
      createdAt: now,
    },
  ]);
  created.push(textMsg);

  const unreadField = senderRole === 'customer' ? 'adminUnread' : 'customerUnread';
  await Conversation.findByIdAndUpdate(conversationId, {
    lastMessage: {
      content: lastContent,
      sentAt: now,
      senderId: senderObjId,
    },
    updatedAt: now,
    $inc: { [unreadField]: 1 },
  });

  return created;
};

export const sendImageMessage = async (
  conversationId: string,
  senderId: string,
  senderRole: 'customer' | 'admin',
  imageUrl: string,
  imagePublicId: string
): Promise<IMessage> => {
  const conv = await Conversation.findById(conversationId);
  if (!conv) throw new Error('Conversation not found');

  const senderObjId = new Types.ObjectId(senderId);
  const convObjId = new Types.ObjectId(conversationId);
  const now = new Date();

  const [msg] = await Message.create([
    {
      conversationId: convObjId,
      senderId: senderObjId,
      senderRole,
      type: 'image',
      imageUrl,
      imagePublicId,
      status: 'sent',
      createdAt: now,
    },
  ]);

  const unreadField = senderRole === 'customer' ? 'adminUnread' : 'customerUnread';
  await Conversation.findByIdAndUpdate(conversationId, {
    lastMessage: {
      content: '[Image]',
      sentAt: now,
      senderId: senderObjId,
    },
    updatedAt: now,
    $inc: { [unreadField]: 1 },
  });

  return msg;
};

export const sendVideoMessage = async (
  conversationId: string,
  senderId: string,
  senderRole: 'customer' | 'admin',
  videoUrl: string,
  videoPublicId: string
): Promise<IMessage> => {
  const conv = await Conversation.findById(conversationId);
  if (!conv) throw new Error('Conversation not found');

  const senderObjId = new Types.ObjectId(senderId);
  const convObjId = new Types.ObjectId(conversationId);
  const now = new Date();

  const [msg] = await Message.create([
    {
      conversationId: convObjId,
      senderId: senderObjId,
      senderRole,
      type: 'video',
      videoUrl,
      videoPublicId,
      status: 'sent',
      createdAt: now,
    },
  ]);

  const unreadField = senderRole === 'customer' ? 'adminUnread' : 'customerUnread';
  await Conversation.findByIdAndUpdate(conversationId, {
    lastMessage: {
      content: '[Video]',
      sentAt: now,
      senderId: senderObjId,
    },
    updatedAt: now,
    $inc: { [unreadField]: 1 },
  });

  return msg;
};

export const markDelivered = async (
  conversationId: string,
  userId: string,
  userRole: string
): Promise<{ updatedCount: number; messageIds: string[] }> => {
  const conv = await Conversation.findById(conversationId);
  if (!conv) throw new Error('Conversation not found');

  const senderField = userRole === 'admin' ? 'customer' : 'admin';
  const sentMessages = await Message.find({
    conversationId: new Types.ObjectId(conversationId),
    senderRole: senderField,
    status: 'sent',
  })
    .select('_id')
    .lean();

  const messageIds = sentMessages.map((m) => m._id.toString());

  if (messageIds.length > 0) {
    await Message.updateMany(
      {
        conversationId: new Types.ObjectId(conversationId),
        senderRole: senderField,
        status: 'sent',
      },
      { $set: { status: 'delivered' } }
    );
  }

  const unreadField = userRole === 'admin' ? 'adminUnread' : 'customerUnread';
  await Conversation.findByIdAndUpdate(conversationId, {
    $set: { [unreadField]: 0 },
  });

  return { updatedCount: messageIds.length, messageIds };
};

export const deleteMessage = async (
  conversationId: string,
  messageId: string,
  userId: string,
  userRole: string
): Promise<{ deleted: boolean }> => {
  const msg = await Message.findOne({
    _id: new Types.ObjectId(messageId),
    conversationId: new Types.ObjectId(conversationId),
  });

  if (!msg) throw new Error('Message not found');

  const isSender = msg.senderId.toString() === userId;
  const isAdmin = userRole === 'admin';

  const withinWindow = Date.now() - msg.createdAt.getTime() <= CUSTOMER_DELETE_WINDOW_MS;

  if (!isSender && !isAdmin) throw new Error('Forbidden: not sender or admin');
  if (isSender && !isAdmin && !withinWindow) {
    throw new Error('Message can only be deleted within 5 minutes');
  }

  await Message.findByIdAndDelete(messageId);

  const lastMsg = await Message.findOne({ conversationId: new Types.ObjectId(conversationId) })
    .sort({ _id: -1 })
    .lean();

  const lastContent = lastMsg
    ? lastMsg.type === 'image'
      ? '[Image]'
      : lastMsg.type === 'video'
        ? '[Video]'
        : (lastMsg.content ?? '').slice(0, 100)
    : 'Conversation started';
  const lastSentAt = lastMsg?.createdAt ?? new Date();
  const lastSenderId = lastMsg?.senderId ?? msg.senderId;

  await Conversation.findByIdAndUpdate(conversationId, {
    lastMessage: {
      content: lastContent,
      sentAt: lastSentAt,
      senderId: lastSenderId,
    },
    updatedAt: new Date(),
  });

  return { deleted: true };
};

export const getMessageById = async (messageId: string) => {
  return Message.findById(messageId).lean();
};

export const resetUnreadForConversation = async (
  conversationId: string,
  userRole: 'customer' | 'admin'
) => {
  const field = userRole === 'admin' ? 'adminUnread' : 'customerUnread';
  await Conversation.findByIdAndUpdate(conversationId, { $set: { [field]: 0 } });
};
