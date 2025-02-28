// src/routes/profile.ts
import { Router, Request, Response } from 'express';
import { getProfile } from '../repos/profile';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

router.get('/profile', authenticateJWT, async (req: Request, res: Response) => {
  console.log('Before try block');
  try {
    const userDid = req.user?.did;
    console.log('User DID:', userDid);
    if (!userDid) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const profile = await getProfile(userDid);
    if (!profile) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }

    res.status(200).json({ profile });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
