"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminGetConversationMessages = exports.adminListConversations = void 0;
const chat_service_1 = require("../services/chat.service");
const adminListConversations = async (req, res) => {
    try {
        const conversations = await (0, chat_service_1.getAdminConversations)();
        return res.status(200).json({ conversations });
    }
    catch (error) {
        console.error('Admin list conversations error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.adminListConversations = adminListConversations;
const adminGetConversationMessages = async (req, res) => {
    try {
        const id = req.params.id;
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
        console.error('Admin get messages error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.adminGetConversationMessages = adminGetConversationMessages;
