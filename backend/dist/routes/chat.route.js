"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const chat_controller_1 = require("../controllers/chat.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => cb(null, 'uploads/'),
    filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const imageUpload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp'];
        if (allowed.includes(file.mimetype))
            cb(null, true);
        else
            cb(new Error('Only JPEG, PNG, WEBP allowed'));
    },
});
const videoUpload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const allowed = ['video/mp4', 'video/webm', 'video/quicktime'];
        if (allowed.includes(file.mimetype))
            cb(null, true);
        else
            cb(new Error('Only MP4, WebM, MOV allowed'));
    },
});
router.post('/', auth_middleware_1.authenticate, chat_controller_1.createOrGetConversation);
router.get('/', auth_middleware_1.authenticate, chat_controller_1.listMyConversations);
router.get('/:id/messages', auth_middleware_1.authenticate, chat_controller_1.getConversationMessages);
router.post('/:id/messages', auth_middleware_1.authenticate, chat_controller_1.postTextMessage);
router.post('/:id/messages/image', auth_middleware_1.authenticate, imageUpload.single('image'), chat_controller_1.postImageMessage);
router.post('/:id/messages/video', auth_middleware_1.authenticate, videoUpload.single('video'), chat_controller_1.postVideoMessage);
router.patch('/:id/delivered', auth_middleware_1.authenticate, chat_controller_1.patchDelivered);
router.delete('/:id/messages/:messageId', auth_middleware_1.authenticate, chat_controller_1.deleteMessageHandler);
exports.default = router;
