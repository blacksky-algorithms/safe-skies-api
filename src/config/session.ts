// src/config/session.ts
import session from 'express-session';
import { AuthSessionStore } from './session-store';

export default session({
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  store: new AuthSessionStore(),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    sameSite: 'lax',
  },
});
