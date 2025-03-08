import { Router } from 'express';
import { getReportOptions } from '../controllers/moderation.controller';

const router = Router();

router.get('/report-options', getReportOptions);

export default router;
