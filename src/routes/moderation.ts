import { Router } from 'express';
import {
  getModerationServices,
  getReportOptions,
  reportModerationEvents,
} from '../controllers/moderation.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

router.get('/report-options', getReportOptions);
router.get('/services', authenticateJWT, getModerationServices);
router.post('/report', authenticateJWT, reportModerationEvents);

export default router;
