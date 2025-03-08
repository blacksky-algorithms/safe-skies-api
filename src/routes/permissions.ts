// src/routes/permissions.ts
import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth.middleware';
import {
  promoteModerator,
  demoteModerator,
  listModerators,
  checkFeedRole,
} from '../controllers/permissions.controller';

const router = Router();

// Promote a user to moderator (set their role to 'mod').
router.post('/admin/promote', authenticateJWT, promoteModerator);

// Demote a moderator (set their role to 'user').
router.post('/admin/demote', authenticateJWT, demoteModerator);

// If a "feed" query parameter is provided, lists moderators for that feed;
// otherwise, lists all moderators for the admin.
router.get('/admin/moderators', authenticateJWT, listModerators);

router.get('/admin/check-role', authenticateJWT, checkFeedRole);

export default router;
