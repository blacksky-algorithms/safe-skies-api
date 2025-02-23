// // src/repos/storage.ts
// import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
// import { SupabaseInstance } from './supabase';

// /* Ensure that ENCRYPTION_KEY is defined and is a base64‑encoded 32-byte key */
// const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
// if (!ENCRYPTION_KEY) {
//   throw new Error('ENCRYPTION_KEY is not defined.');
// }
// const ENCRYPTION_KEY_BUFFER = Buffer.from(ENCRYPTION_KEY, 'base64');
// if (ENCRYPTION_KEY_BUFFER.length !== 32) {
//   throw new Error('ENCRYPTION_KEY must be exactly 32 bytes.');
// }

// /* Encryption helpers */
// const encrypt = (data: string): { iv: string; encrypted: string } => {
//   const iv = randomBytes(16);
//   const cipher = createCipheriv('aes-256-cbc', ENCRYPTION_KEY_BUFFER, iv);
//   const encrypted = cipher.update(data, 'utf8', 'hex') + cipher.final('hex');
//   return { iv: iv.toString('hex'), encrypted };
// };

// const decrypt = ({
//   iv,
//   encrypted,
// }: {
//   iv: string;
//   encrypted: string;
// }): string => {
//   const decipher = createDecipheriv(
//     'aes-256-cbc',
//     ENCRYPTION_KEY_BUFFER,
//     Buffer.from(iv, 'hex')
//   );
//   const decrypted =
//     decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8');
//   return decrypted;
// };

// /* StateStore – for OAuth state */
// export class StateStore {
//   async get(key: string): Promise<any | undefined> {
//     const { data, error } = await SupabaseInstance.from('auth_states')
//       .select('state')
//       .eq('key', key)
//       .single();
//     if (error) {
//       console.error('StateStore.get error:', error);
//       return undefined;
//     }
//     if (!data || !data.state) return undefined;
//     try {
//       // data.state is stored as an object (JSONB), e.g. { iv, encrypted }
//       const stored = data.state;
//       const decrypted = decrypt(stored);
//       return JSON.parse(decrypted);
//     } catch (err) {
//       console.error('Error decrypting state:', err);
//       return undefined;
//     }
//   }

//   async set(key: string, value: object): Promise<void> {
//     try {
//       const plaintext = JSON.stringify(value);
//       const { iv, encrypted } = encrypt(plaintext);
//       const { error } = await SupabaseInstance.from('auth_states').upsert({
//         key,
//         state: { iv, encrypted },
//       });
//       if (error) {
//         console.error('StateStore.set error:', error);
//         throw error;
//       }
//     } catch (err) {
//       console.error('StateStore.set exception:', err);
//       throw err;
//     }
//   }

//   async del(key: string): Promise<void> {
//     const { error } = await SupabaseInstance.from('auth_states')
//       .delete()
//       .eq('key', key);
//     if (error) {
//       console.error('StateStore.del error:', error);
//       throw error;
//     }
//   }
// }

// /* SessionStore – for OAuth session data (including tokenSet) */
// export class SessionStore {
//   async get(key: string): Promise<any | undefined> {
//     const { data, error } = await SupabaseInstance.from('auth_sessions')
//       .select('session')
//       .eq('key', key)
//       .single();
//     if (error) {
//       console.error('SessionStore.get error:', error);
//       return undefined;
//     }
//     if (!data || !data.session) return undefined;
//     try {
//       const stored = data.session;
//       const decrypted = decrypt(stored);
//       return JSON.parse(decrypted);
//     } catch (err) {
//       console.error('Error decrypting session:', err);
//       return undefined;
//     }
//   }

//   async set(key: string, value: object): Promise<void> {
//     try {
//       const plaintext = JSON.stringify(value);
//       const { iv, encrypted } = encrypt(plaintext);
//       const { error } = await SupabaseInstance.from('auth_sessions').upsert({
//         key,
//         session: { iv, encrypted },
//       });
//       if (error) {
//         console.error('SessionStore.set error:', error);
//         throw error;
//       }
//     } catch (err) {
//       console.error('SessionStore.set exception:', err);
//       throw err;
//     }
//   }

//   async del(key: string): Promise<void> {
//     const { error } = await SupabaseInstance.from('auth_sessions')
//       .delete()
//       .eq('key', key);
//     if (error) {
//       console.error('SessionStore.del error:', error);
//       throw error;
//     }
//   }
// }

import { query } from '../config/db';
import { decrypt, encrypt } from '../lib/utils/encryption';

export class StateStore {
  async get(key: string) {
    const result = await query('SELECT state FROM auth_states WHERE key = $1', [
      key,
    ]);

    if (result.rows.length === 0) return undefined;
    return JSON.parse(decrypt(JSON.parse(result.rows[0].state)));
  }

  async set(key: string, value: object) {
    const { iv, encrypted } = encrypt(JSON.stringify(value));
    const encryptedState = JSON.stringify({ iv, encrypted });

    await query(
      `INSERT INTO auth_states (key, state) 
       VALUES ($1, $2) 
       ON CONFLICT (key) DO UPDATE SET state = $2`,
      [key, encryptedState]
    );
  }

  async del(key: string) {
    await query('DELETE FROM auth_states WHERE key = $1', [key]);
  }
}

export class SessionStore {
  async get(key: string) {
    const result = await query(
      'SELECT session FROM auth_sessions WHERE key = $1',
      [key]
    );

    if (result.rows.length === 0) return undefined;
    return JSON.parse(decrypt(JSON.parse(result.rows[0].session)));
  }

  async set(key: string, value: object) {
    const { iv, encrypted } = encrypt(JSON.stringify(value));
    const encryptedSession = JSON.stringify({ iv, encrypted });

    await query(
      `INSERT INTO auth_sessions (key, session) 
       VALUES ($1, $2) 
       ON CONFLICT (key) DO UPDATE SET session = $2`,
      [key, encryptedSession]
    );
  }

  async del(key: string) {
    await query('DELETE FROM auth_sessions WHERE key = $1', [key]);
  }
}
