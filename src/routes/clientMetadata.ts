import { Router } from 'express';
import { BLUE_SKY_CLIENT_META_DATA } from '../lib/constants/client-metadata';

const router = Router();

router.get('/oauth/client-metadata.json', (req, res) => {
  res.header('Content-Type', 'application/json');
  res.json(BLUE_SKY_CLIENT_META_DATA);
});

export default router;
