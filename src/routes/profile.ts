import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth.middleware';
import { getProfile } from '../controllers/profile.controller';

const router = Router();

router.get('/profile', authenticateJWT, getProfile);

export default router;
