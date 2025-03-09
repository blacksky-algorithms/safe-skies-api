import { db } from '../config/db'; // Knex instance
import { decrypt, encrypt } from '../lib/utils/encryption';

/**
 * StateStore manages short-lived OAuth state entries in the 'auth_states' table.
 */
export class StateStore {
  /**
   * Retrieves and decrypts a stored state by key.
   */
  async get(key: string) {
    try {
      const row = await db('auth_states')
        .select('state')
        .where({ key })
        .first();

      if (!row) {
        console.warn(`StateStore.get: No state found for key`);
        return undefined;
      }

      const rawState = row.state;

      let parsedState: any;
      if (typeof rawState === 'string') {
        try {
          parsedState = JSON.parse(rawState);
        } catch (e) {
          console.error(`StateStore.get: Error parsing raw state as JSON`, e);
          throw e;
        }
      } else {
        parsedState = rawState;
      }

      const decrypted = decrypt(parsedState);

      const finalState = JSON.parse(decrypted);

      return finalState;
    } catch (error) {
      console.error('StateStore.get error:', error);
      return undefined;
    }
  }

  /**
   * Encrypts and upserts a state object by key.
   */
  async set(key: string, value: object) {
    try {
      const valueString = JSON.stringify(value);
      const { iv, encrypted } = encrypt(valueString);
      const encryptedState = JSON.stringify({ iv, encrypted });

      await db('auth_states')
        .insert({ key, state: encryptedState })
        .onConflict('key')
        .merge({ state: encryptedState });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Deletes the state entry by key.
   */
  async del(key: string) {
    try {
      await db('auth_states').where({ key }).del();
    } catch (error) {
      console.error('StateStore.del error:', error);
      throw error;
    }
  }
}

/**
 * SessionStore manages longer-lived user sessions in the 'auth_sessions' table.
 */
export class SessionStore {
  /**
   * Retrieves and decrypts a stored session by key.
   */
  async get(key: string) {
    try {
      const row = await db('auth_sessions')
        .select('session')
        .where({ key })
        .first();
      if (!row) {
        return undefined;
      }

      const rawSession = row.session;

      let parsedSession: any;
      if (typeof rawSession === 'string') {
        try {
          parsedSession = JSON.parse(rawSession);
        } catch (e) {
          console.error(
            `SessionStore.get: Error parsing raw session as JSON`,
            e
          );
          throw e;
        }
      } else {
        parsedSession = rawSession;
      }

      const decrypted = decrypt(parsedSession);

      const finalSession = JSON.parse(decrypted);

      return finalSession;
    } catch (error) {
      console.error('SessionStore.get error:', error);
      return undefined;
    }
  }

  /**
   * Encrypts and upserts a session object by key.
   */
  async set(key: string, value: object) {
    try {
      const valueString = JSON.stringify(value);
      const { iv, encrypted } = encrypt(valueString);
      const encryptedSession = JSON.stringify({ iv, encrypted });

      await db('auth_sessions')
        .insert({ key, session: encryptedSession })
        .onConflict('key')
        .merge({ session: encryptedSession });
    } catch (error) {
      console.error('SessionStore.set error:', error);
      throw error;
    }
  }

  /**
   * Deletes the session entry by key.
   */
  async del(key: string) {
    try {
      await db('auth_sessions').where({ key }).del();
    } catch (error) {
      console.error('SessionStore.del error:', error);
      throw error;
    }
  }
}
