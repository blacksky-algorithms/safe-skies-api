// src/routes/auth.ts
import { Router } from 'express';
import { signin, callback, logout } from '../controllers/auth.controller';

const router = Router();

router.get('/signin', signin);
router.get('/callback', callback);
router.post('/logout', logout);

export default router;
