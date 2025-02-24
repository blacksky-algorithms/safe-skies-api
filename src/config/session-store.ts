// src/config/session-store.ts
import { Store } from 'express-session';
import { db } from './db'; // Your Knex instance
import { decrypt, encrypt } from '../lib/utils/encryption';

export class AuthSessionStore extends Store {
  async get(sid: string, callback: (err: any, session?: any | null) => void) {
    try {
      const row = await db('auth_sessions')
        .select('session')
        .where({ key: sid })
        .first();

      if (!row) return callback(null, null);

      // Decrypt the session data
      const decrypted = decrypt(JSON.parse(row.session));
      const session = JSON.parse(decrypted);

      callback(null, session);
    } catch (err) {
      callback(err);
    }
  }

  async set(sid: string, session: any, callback?: (err?: any) => void) {
    try {
      // Encrypt session data
      const sessionString = JSON.stringify(session);
      const { iv, encrypted } = encrypt(sessionString);
      const encryptedSession = JSON.stringify({ iv, encrypted });

      await db('auth_sessions')
        .insert({
          key: sid,
          session: encryptedSession,
          created_at: db.fn.now(),
        })
        .onConflict('key')
        .merge({
          session: encryptedSession,
          created_at: db.fn.now(),
        });

      callback?.();
    } catch (err) {
      callback?.(err);
    }
  }

  async destroy(sid: string, callback?: (err?: any) => void) {
    try {
      await db('auth_sessions').where({ key: sid }).del();
      callback?.();
    } catch (err) {
      callback?.(err);
    }
  }

  async touch(sid: string, session: any, callback?: () => void) {
    // Optional: Implement if needed
    callback?.();
  }
}
