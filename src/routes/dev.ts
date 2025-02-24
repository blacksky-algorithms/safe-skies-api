import { Router } from 'express';
import { developmentOnly } from '../middleware/dev-only';
import { devLogin } from '../controllers/dev.controller';

const router = Router();

router.post('/login', developmentOnly, devLogin);

export default router;
