import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import {
  createOrGetConversation,
  listMyConversations,
  getConversationMessages,
  postTextMessage,
  postImageMessage,
  postVideoMessage,
  patchDelivered,
  deleteMessageHandler,
} from '../controllers/chat.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = 'uploads/';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const imageUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPEG, PNG, WEBP allowed'));
  },
});

const videoUpload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['video/mp4', 'video/webm', 'video/quicktime'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only MP4, WebM, MOV allowed'));
  },
});

router.post('/', authenticate, createOrGetConversation);
router.get('/', authenticate, listMyConversations);
router.get('/:id/messages', authenticate, getConversationMessages);
router.post('/:id/messages', authenticate, postTextMessage);
router.post('/:id/messages/image', authenticate, imageUpload.single('image'), postImageMessage);
router.post('/:id/messages/video', authenticate, videoUpload.single('video'), postVideoMessage);
router.patch('/:id/delivered', authenticate, patchDelivered);
router.delete('/:id/messages/:messageId', authenticate, deleteMessageHandler);

export default router;
