import { Router } from 'express';
import { developmentOnly } from '../middleware/dev-only.middleware';
import { devLogin, getRudyActiveFeeds } from '../controllers/dev.controller';

const router = Router();

router.post('/login', developmentOnly, devLogin);

router.get('/get/test', developmentOnly, getRudyActiveFeeds);

export default router;
