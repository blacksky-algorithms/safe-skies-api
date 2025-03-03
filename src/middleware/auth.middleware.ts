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
  // Extract the token from the Authorization header
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Unauthorized: No token provided' });
    return;
  }

  try {
    // Verify the token using the JWT_SECRET
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('Missing JWT_SECRET environment variable');
    }
    const decoded = jwt.verify(token, secret) as SessionPayload;

    // Attach the decoded user data to the request object
    req.user = decoded;

    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    res.status(401).json({
      error: 'Unauthorized: Invalid token',
    });
  }
};
