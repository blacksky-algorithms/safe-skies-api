import { Router } from 'express';
import { getUserFeeds } from '../controllers/feed.controller';

const router = Router();

router.get('/user-feeds', getUserFeeds);

export default router;
