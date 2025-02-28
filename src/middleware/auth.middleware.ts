// src/middleware/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import { SessionPayload } from '../lib/types/session';
import jwt from 'jsonwebtoken';

declare module 'express-serve-static-core' {
  interface Request {
    user?: SessionPayload;
  }
}

export const authenticateJWT = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const token = req.cookies.session_token;
  if (!token) {
    res.status(401).json({ error: 'Unauthorized: No token provided' });
    return;
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded as SessionPayload;
    console.log('Authenticated user:', req.user);
    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    res.status(401).json({
      error: 'Unauthorized: Invalid token',
    });
    return;
  }
};
