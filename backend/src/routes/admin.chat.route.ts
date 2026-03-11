import { Router } from 'express';
import {
  adminListConversations,
  adminGetConversationMessages,
} from '../controllers/admin.chat.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireAdminEmail } from '../middlewares/role.middleware';

const router = Router();

router.get('/', authenticate, requireAdminEmail, adminListConversations);
router.get('/:id/messages', authenticate, requireAdminEmail, adminGetConversationMessages);

export default router;
