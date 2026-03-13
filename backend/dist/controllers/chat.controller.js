"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMessageHandler = exports.patchDelivered = exports.postVideoMessage = exports.postImageMessage = exports.postTextMessage = exports.getConversationMessages = exports.listMyConversations = exports.createOrGetConversation = void 0;
const chat_service_1 = require("../services/chat.service");
const cloudinary_1 = require("../config/cloudinary");
const cloudinary_2 = __importDefault(require("cloudinary"));
const fs_1 = __importDefault(require("fs"));
const chat_socket_1 = require("../socket/chat.socket");
const getSenderRole = (role) => {
    return role === 'admin' ? 'admin' : 'customer';
};
const getIo = (req) => {
    return req.app.get?.('io') ?? null;
};
const createOrGetConversation = async (req, res) => {
    try {
        const customerId = req.user?.sub;
        if (!customerId)
            return res.status(401).json({ message: 'Unauthorized' });
        const { productId } = req.body ?? {};
        const { conversation, product, isNew } = await (0, chat_service_1.findOrCreateConversation)(customerId, productId || undefined);
        const io = getIo(req);
        if (io && isNew) {
            (0, chat_socket_1.emitNewConversation)(io, conversation);
        }
        return res.status(isNew ? 201 : 200).json({
            conversationId: conversation._id,
            isNew,
            product: product ?? null,
        });
    }
    catch (error) {
        console.error('Create conversation error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.createOrGetConversation = createOrGetConversation;
const listMyConversations = async (req, res) => {
    try {
        const customerId = req.user?.sub;
        if (!customerId)
            return res.status(401).json({ message: 'Unauthorized' });
        const conversations = await (0, chat_service_1.getConversationsForCustomer)(customerId);
        return res.status(200).json({ conversations });
    }
    catch (error) {
        console.error('List conversations error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.listMyConversations = listMyConversations;
const getConversationMessages = async (req, res) => {
    try {
        const userId = req.user?.sub;
        const userRole = req.user?.role ?? 'customer';
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const id = req.params.id;
        const conv = await (0, chat_service_1.getConversationById)(id);
        if (!conv)
            return res.status(404).json({ message: 'Conversation not found' });
        if (userRole !== 'admin' && conv.customerId.toString() !== userId) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const limit = Math.min(parseInt(req.query.limit) || 30, 50);
        const before = req.query.before;
        const { messages, hasMore, nextCursor } = await (0, chat_service_1.getMessages)(id, limit, before);
        return res.status(200).json({
            messages,
            hasMore,
            nextCursor: nextCursor?.toString() ?? null,
        });
    }
    catch (error) {
        console.error('Get messages error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getConversationMessages = getConversationMessages;
const ensureConversationAccess = async (conversationId, userId, userRole) => {
    const conv = await (0, chat_service_1.getConversationById)(conversationId);
    if (!conv)
        throw new Error('Conversation not found');
    if (userRole !== 'admin' && conv.customerId.toString() !== userId) {
        throw new Error('Forbidden');
    }
};
const postTextMessage = async (req, res) => {
    try {
        const userId = req.user?.sub;
        const userRole = req.user?.role ?? 'customer';
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const id = req.params.id;
        await ensureConversationAccess(id, userId, userRole);
        const { content, productCard } = req.body ?? {};
        if (!content || typeof content !== 'string' || !content.trim()) {
            return res.status(400).json({ message: 'Content is required' });
        }
        const senderRole = getSenderRole(userRole);
        const created = await (0, chat_service_1.sendTextMessage)(id, userId, senderRole, content.trim(), productCard);
        const lastMsg = created[created.length - 1];
        const io = getIo(req);
        if (io) {
            const serialize = (m) => (m && typeof m.toObject === 'function' ? m.toObject() : m);
            if (created.length > 1) {
                (0, chat_socket_1.emitNewMessages)(io, id, created.map(serialize));
            }
            else {
                (0, chat_socket_1.emitNewMessage)(io, id, serialize(lastMsg));
            }
        }
        return res.status(201).json(created.length === 1
            ? lastMsg
            : { messages: created, lastMessage: lastMsg });
    }
    catch (error) {
        if (error instanceof Error) {
            if (error.message === 'Conversation not found')
                return res.status(404).json({ message: 'Conversation not found' });
            if (error.message === 'Forbidden')
                return res.status(403).json({ message: 'Forbidden' });
        }
        console.error('Send message error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.postTextMessage = postTextMessage;
const postImageMessage = async (req, res) => {
    try {
        const userId = req.user?.sub;
        const userRole = req.user?.role ?? 'customer';
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const file = req.file;
        if (!file)
            return res.status(400).json({ message: 'Image file is required' });
        const id = req.params.id;
        await ensureConversationAccess(id, userId, userRole);
        const senderRole = getSenderRole(userRole);
        const uploaded = await (0, cloudinary_1.uploadImage)(file.path, { folder: 'pht_chat' });
        try {
            fs_1.default.unlinkSync(file.path);
        }
        catch {
            // ignore cleanup error
        }
        const msg = await (0, chat_service_1.sendImageMessage)(id, userId, senderRole, uploaded.secure_url, uploaded.public_id);
        const io = getIo(req);
        if (io) {
            const serialized = msg && typeof msg.toObject === 'function' ? msg.toObject() : msg;
            (0, chat_socket_1.emitNewMessage)(io, id, serialized);
        }
        return res.status(201).json(msg);
    }
    catch (error) {
        if (error instanceof Error) {
            if (error.message === 'Conversation not found')
                return res.status(404).json({ message: 'Conversation not found' });
            if (error.message === 'Forbidden')
                return res.status(403).json({ message: 'Forbidden' });
        }
        console.error('Send image error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.postImageMessage = postImageMessage;
const postVideoMessage = async (req, res) => {
    try {
        const userId = req.user?.sub;
        const userRole = req.user?.role ?? 'customer';
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const file = req.file;
        if (!file)
            return res.status(400).json({ message: 'Video file is required' });
        const id = req.params.id;
        await ensureConversationAccess(id, userId, userRole);
        const senderRole = getSenderRole(userRole);
        const uploaded = await (0, cloudinary_1.uploadVideo)(file.path, { folder: 'pht_chat_videos' });
        try {
            fs_1.default.unlinkSync(file.path);
        }
        catch {
            // ignore cleanup error
        }
        const msg = await (0, chat_service_1.sendVideoMessage)(id, userId, senderRole, uploaded.secure_url, uploaded.public_id);
        const io = getIo(req);
        if (io) {
            const serialized = msg && typeof msg.toObject === 'function' ? msg.toObject() : msg;
            (0, chat_socket_1.emitNewMessage)(io, id, serialized);
        }
        return res.status(201).json(msg);
    }
    catch (error) {
        if (error instanceof Error) {
            if (error.message === 'Conversation not found')
                return res.status(404).json({ message: 'Conversation not found' });
            if (error.message === 'Forbidden')
                return res.status(403).json({ message: 'Forbidden' });
        }
        console.error('Send video error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.postVideoMessage = postVideoMessage;
const patchDelivered = async (req, res) => {
    try {
        const userId = req.user?.sub;
        const userRole = req.user?.role ?? 'customer';
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const id = req.params.id;
        await ensureConversationAccess(id, userId, userRole);
        const { updatedCount, messageIds } = await (0, chat_service_1.markDelivered)(id, userId, userRole);
        const io = getIo(req);
        if (io && messageIds.length > 0) {
            (0, chat_socket_1.emitMessagesDelivered)(io, id, messageIds);
        }
        return res.status(200).json({ updatedCount, messageIds });
    }
    catch (error) {
        if (error instanceof Error) {
            if (error.message === 'Conversation not found')
                return res.status(404).json({ message: 'Conversation not found' });
            if (error.message === 'Forbidden')
                return res.status(403).json({ message: 'Forbidden' });
        }
        console.error('Mark delivered error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.patchDelivered = patchDelivered;
const deleteMessageHandler = async (req, res) => {
    try {
        const userId = req.user?.sub;
        const userRole = req.user?.role ?? 'customer';
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const id = req.params.id;
        const messageId = req.params.messageId;
        await ensureConversationAccess(id, userId, userRole);
        const msg = await (0, chat_service_1.getMessageById)(messageId);
        if (!msg)
            return res.status(404).json({ message: 'Message not found' });
        if (msg.type === 'image' && msg.imagePublicId) {
            try {
                await cloudinary_2.default.v2.uploader.destroy(msg.imagePublicId);
            }
            catch (e) {
                console.error('Cloudinary destroy error:', e);
            }
        }
        if (msg.type === 'video' && msg.videoPublicId) {
            try {
                await cloudinary_2.default.v2.uploader.destroy(msg.videoPublicId, { resource_type: 'video' });
            }
            catch (e) {
                console.error('Cloudinary destroy video error:', e);
            }
        }
        await (0, chat_service_1.deleteMessage)(id, messageId, userId, userRole);
        const io = getIo(req);
        if (io) {
            (0, chat_socket_1.emitMessageDeleted)(io, id, messageId);
        }
        return res.status(200).json({ deleted: true });
    }
    catch (error) {
        if (error instanceof Error) {
            if (error.message === 'Message not found')
                return res.status(404).json({ message: error.message });
            if (error.message === 'Forbidden: not sender or admin')
                return res.status(403).json({ message: error.message });
            if (error.message.includes('5 minutes'))
                return res.status(400).json({ message: error.message });
        }
        console.error('Delete message error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.deleteMessageHandler = deleteMessageHandler;
