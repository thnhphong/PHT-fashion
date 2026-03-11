import { Router } from 'express';
import multer from 'multer';
import {
  createOrGetConversation,
  listMyConversations,
  getConversationMessages,
  postTextMessage,
  postImageMessage,
  patchDelivered,
  deleteMessageHandler,
} from '../controllers/chat.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, 'uploads/'),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPEG, PNG, WEBP allowed'));
  },
});

router.post('/', authenticate, createOrGetConversation);
router.get('/', authenticate, listMyConversations);
router.get('/:id/messages', authenticate, getConversationMessages);
router.post('/:id/messages', authenticate, postTextMessage);
router.post('/:id/messages/image', authenticate, upload.single('image'), postImageMessage);
router.patch('/:id/delivered', authenticate, patchDelivered);
router.delete('/:id/messages/:messageId', authenticate, deleteMessageHandler);

export default router;
