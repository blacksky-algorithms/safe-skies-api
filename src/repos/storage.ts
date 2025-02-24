// src/repos/storage.ts

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
      console.log(`StateStore.get: Retrieving state for key: ${key}`);
      const row = await db('auth_states')
        .select('state')
        .where({ key })
        .first();
      console.log(`StateStore.get: Retrieved row: ${JSON.stringify(row)}`);
      if (!row) {
        console.log(`StateStore.get: No state found for key: ${key}`);
        return undefined;
      }

      // Assuming row.state is stored as a string (JSON string)
      const rawState = row.state;
      console.log(`StateStore.get: Raw state from DB: ${rawState}`);

      // If it's a string, parse it to get the encrypted object
      let parsedState: any;
      if (typeof rawState === 'string') {
        try {
          parsedState = JSON.parse(rawState);
        } catch (e) {
          console.error(
            `StateStore.get: Error parsing raw state as JSON: ${rawState}`,
            e
          );
          throw e;
        }
      } else {
        parsedState = rawState;
      }
      console.log(
        `StateStore.get: Parsed state: ${JSON.stringify(parsedState)}`
      );

      const decrypted = decrypt(parsedState);
      console.log(`StateStore.get: Decrypted state string: ${decrypted}`);

      const finalState = JSON.parse(decrypted);
      console.log(
        `StateStore.get: Final state object: ${JSON.stringify(finalState)}`
      );
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
      console.log(
        `StateStore.set: Setting state for key: ${key} with value: ${JSON.stringify(value)}`
      );
      const valueString = JSON.stringify(value);
      const { iv, encrypted } = encrypt(valueString);
      const encryptedState = JSON.stringify({ iv, encrypted });
      console.log(`StateStore.set: Encrypted state: ${encryptedState}`);

      await db('auth_states')
        .insert({ key, state: encryptedState })
        .onConflict('key')
        .merge({ state: encryptedState });
      console.log(`StateStore.set: State stored successfully for key: ${key}`);
    } catch (error) {
      console.error('StateStore.set error:', error);
      throw error;
    }
  }

  /**
   * Deletes the state entry by key.
   */
  async del(key: string) {
    try {
      console.log(`StateStore.del: Deleting state for key: ${key}`);
      await db('auth_states').where({ key }).del();
      console.log(`StateStore.del: State deleted successfully for key: ${key}`);
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
      console.log(`SessionStore.get: Retrieving session for key: ${key}`);
      const row = await db('auth_sessions')
        .select('session')
        .where({ key })
        .first();
      console.log(`SessionStore.get: Retrieved row`);
      if (!row) {
        console.log(`SessionStore.get: No session found for key: ${key}`);
        return undefined;
      }

      const rawSession = row.session;
      console.log(`SessionStore.get: Raw session from DB`);

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
      console.log(`SessionStore.get: Parsed session`);

      const decrypted = decrypt(parsedSession);
      console.log(`SessionStore.get: Decrypted session string`);

      const finalSession = JSON.parse(decrypted);
      console.log(
        `SessionStore.get: Final session object: ${JSON.stringify(finalSession)}`
      );
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
      console.log(
        `SessionStore.set: Setting session for key: ${key} with value: ${JSON.stringify(value)}`
      );
      const valueString = JSON.stringify(value);
      const { iv, encrypted } = encrypt(valueString);
      const encryptedSession = JSON.stringify({ iv, encrypted });
      console.log(`SessionStore.set: Encrypted session`);

      await db('auth_sessions')
        .insert({ key, session: encryptedSession })
        .onConflict('key')
        .merge({ session: encryptedSession });
      console.log(
        `SessionStore.set: Session stored successfully for key: ${key}`
      );
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
      console.log(`SessionStore.del: Deleting session for key: ${key}`);
      await db('auth_sessions').where({ key }).del();
      console.log(
        `SessionStore.del: Session deleted successfully for key: ${key}`
      );
    } catch (error) {
      console.error('SessionStore.del error:', error);
      throw error;
    }
  }
}
