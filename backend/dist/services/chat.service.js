"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetUnreadForConversation = exports.getMessageById = exports.deleteMessage = exports.markDelivered = exports.sendVideoMessage = exports.sendImageMessage = exports.sendTextMessage = exports.getMessages = exports.getConversationById = exports.getAdminConversations = exports.getConversationsForCustomer = exports.findOrCreateConversation = void 0;
const mongoose_1 = require("mongoose");
const Conversation_1 = __importDefault(require("../models/Conversation"));
const Message_1 = __importDefault(require("../models/Message"));
const Product_1 = __importDefault(require("../models/Product"));
const MESSAGE_LIMIT_MAX = 50;
const MESSAGE_LIMIT_DEFAULT = 30;
const CUSTOMER_DELETE_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const findOrCreateConversation = async (customerId, productId) => {
    let conversation = await Conversation_1.default.findOne({ customerId: new mongoose_1.Types.ObjectId(customerId) })
        .sort({ updatedAt: -1 })
        .lean();
    const isNew = !conversation;
    if (!conversation) {
        const [newConv] = await Conversation_1.default.create([
            {
                customerId: new mongoose_1.Types.ObjectId(customerId),
                lastMessage: {
                    content: 'Conversation started',
                    sentAt: new Date(),
                    senderId: new mongoose_1.Types.ObjectId(customerId),
                },
                customerUnread: 0,
                adminUnread: 0,
            },
        ]);
        conversation = newConv.toObject();
    }
    let product;
    if (productId) {
        const p = await Product_1.default.findById(productId).select('name price img_url').lean();
        if (p) {
            product = {
                productId: p._id.toString(),
                name: p.name,
                price: p.price,
                img_url: p.img_url,
                slug: p._id.toString(),
            };
        }
    }
    return {
        conversation: conversation,
        product,
        isNew,
    };
};
exports.findOrCreateConversation = findOrCreateConversation;
const getConversationsForCustomer = async (customerId) => {
    const conversations = await Conversation_1.default.find({ customerId: new mongoose_1.Types.ObjectId(customerId) })
        .sort({ updatedAt: -1 })
        .lean();
    return conversations.map((c) => ({
        _id: c._id,
        lastMessage: c.lastMessage,
        customerUnread: c.customerUnread,
        updatedAt: c.updatedAt,
    }));
};
exports.getConversationsForCustomer = getConversationsForCustomer;
const getAdminConversations = async () => {
    return Conversation_1.default.find()
        .populate('customerId', 'name email')
        .sort({ updatedAt: -1 })
        .lean();
};
exports.getAdminConversations = getAdminConversations;
const getConversationById = async (conversationId) => {
    return Conversation_1.default.findById(conversationId).lean();
};
exports.getConversationById = getConversationById;
const getMessages = async (conversationId, limit = MESSAGE_LIMIT_DEFAULT, before) => {
    const cappedLimit = Math.min(limit, MESSAGE_LIMIT_MAX);
    const query = { conversationId: new mongoose_1.Types.ObjectId(conversationId) };
    if (before) {
        query._id = { $lt: new mongoose_1.Types.ObjectId(before) };
    }
    const messages = await Message_1.default.find(query)
        .sort({ _id: -1 })
        .limit(cappedLimit + 1)
        .lean();
    const hasMore = messages.length > cappedLimit;
    const slice = hasMore ? messages.slice(0, cappedLimit) : messages;
    const reversed = slice.reverse();
    return {
        messages: reversed,
        hasMore,
        nextCursor: hasMore ? slice[0]._id : null,
    };
};
exports.getMessages = getMessages;
const sendTextMessage = async (conversationId, senderId, senderRole, content, productCard) => {
    const conv = await Conversation_1.default.findById(conversationId);
    if (!conv)
        throw new Error('Conversation not found');
    const senderObjId = new mongoose_1.Types.ObjectId(senderId);
    const convObjId = new mongoose_1.Types.ObjectId(conversationId);
    const now = new Date();
    const lastContent = content.length > 100 ? content.slice(0, 97) + '...' : content;
    const created = [];
    if (productCard) {
        const [productCardMsg] = await Message_1.default.create([
            {
                conversationId: convObjId,
                senderId: senderObjId,
                senderRole,
                type: 'product_card',
                product: {
                    productId: new mongoose_1.Types.ObjectId(productCard.productId),
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
    const [textMsg] = await Message_1.default.create([
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
    await Conversation_1.default.findByIdAndUpdate(conversationId, {
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
exports.sendTextMessage = sendTextMessage;
const sendImageMessage = async (conversationId, senderId, senderRole, imageUrl, imagePublicId) => {
    const conv = await Conversation_1.default.findById(conversationId);
    if (!conv)
        throw new Error('Conversation not found');
    const senderObjId = new mongoose_1.Types.ObjectId(senderId);
    const convObjId = new mongoose_1.Types.ObjectId(conversationId);
    const now = new Date();
    const [msg] = await Message_1.default.create([
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
    await Conversation_1.default.findByIdAndUpdate(conversationId, {
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
exports.sendImageMessage = sendImageMessage;
const sendVideoMessage = async (conversationId, senderId, senderRole, videoUrl, videoPublicId) => {
    const conv = await Conversation_1.default.findById(conversationId);
    if (!conv)
        throw new Error('Conversation not found');
    const senderObjId = new mongoose_1.Types.ObjectId(senderId);
    const convObjId = new mongoose_1.Types.ObjectId(conversationId);
    const now = new Date();
    const [msg] = await Message_1.default.create([
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
    await Conversation_1.default.findByIdAndUpdate(conversationId, {
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
exports.sendVideoMessage = sendVideoMessage;
const markDelivered = async (conversationId, userId, userRole) => {
    const conv = await Conversation_1.default.findById(conversationId);
    if (!conv)
        throw new Error('Conversation not found');
    const senderField = userRole === 'admin' ? 'customer' : 'admin';
    const sentMessages = await Message_1.default.find({
        conversationId: new mongoose_1.Types.ObjectId(conversationId),
        senderRole: senderField,
        status: 'sent',
    })
        .select('_id')
        .lean();
    const messageIds = sentMessages.map((m) => m._id.toString());
    if (messageIds.length > 0) {
        await Message_1.default.updateMany({
            conversationId: new mongoose_1.Types.ObjectId(conversationId),
            senderRole: senderField,
            status: 'sent',
        }, { $set: { status: 'delivered' } });
    }
    const unreadField = userRole === 'admin' ? 'adminUnread' : 'customerUnread';
    await Conversation_1.default.findByIdAndUpdate(conversationId, {
        $set: { [unreadField]: 0 },
    });
    return { updatedCount: messageIds.length, messageIds };
};
exports.markDelivered = markDelivered;
const deleteMessage = async (conversationId, messageId, userId, userRole) => {
    const msg = await Message_1.default.findOne({
        _id: new mongoose_1.Types.ObjectId(messageId),
        conversationId: new mongoose_1.Types.ObjectId(conversationId),
    });
    if (!msg)
        throw new Error('Message not found');
    const isSender = msg.senderId.toString() === userId;
    const isAdmin = userRole === 'admin';
    const withinWindow = Date.now() - msg.createdAt.getTime() <= CUSTOMER_DELETE_WINDOW_MS;
    if (!isSender && !isAdmin)
        throw new Error('Forbidden: not sender or admin');
    if (isSender && !isAdmin && !withinWindow) {
        throw new Error('Message can only be deleted within 5 minutes');
    }
    await Message_1.default.findByIdAndDelete(messageId);
    const lastMsg = await Message_1.default.findOne({ conversationId: new mongoose_1.Types.ObjectId(conversationId) })
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
    await Conversation_1.default.findByIdAndUpdate(conversationId, {
        lastMessage: {
            content: lastContent,
            sentAt: lastSentAt,
            senderId: lastSenderId,
        },
        updatedAt: new Date(),
    });
    return { deleted: true };
};
exports.deleteMessage = deleteMessage;
const getMessageById = async (messageId) => {
    return Message_1.default.findById(messageId).lean();
};
exports.getMessageById = getMessageById;
const resetUnreadForConversation = async (conversationId, userRole) => {
    const field = userRole === 'admin' ? 'adminUnread' : 'customerUnread';
    await Conversation_1.default.findByIdAndUpdate(conversationId, { $set: { [field]: 0 } });
};
exports.resetUnreadForConversation = resetUnreadForConversation;
