import { Router } from 'express';
import { getLogsController } from '../controllers/logs.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticateJWT, getLogsController);

export default router;
