// src/routes/permissions.ts
import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth.middleware';
import {
  demoteModerator,
  promoteModerator,
} from '../controllers/permissions.controller';

const router = Router();

router.post('/promote', authenticateJWT, promoteModerator);
router.post('/demote', authenticateJWT, demoteModerator);

export default router;
