import { NodeOAuthClient } from '@atproto/oauth-client-node';
import type { RuntimeLock } from '@atproto/oauth-client-node';
import { BLUE_SKY_CLIENT_META_DATA } from '../lib/constants/client-metadata';
import { SessionStore, StateStore } from './storage';
import { Mutex } from 'async-mutex';

const mutex = new Mutex();
const requestLock = async <T>(
  _name: string,
  fn: () => T | Promise<T> | PromiseLike<T>
): Promise<T> => {
  return await mutex.runExclusive(() => Promise.resolve(fn()));
};

class BlueskyOAuthClientSingleton {
  private static instance: NodeOAuthClient;
  private constructor() {}
  public static getInstance(): NodeOAuthClient {
    if (!BlueskyOAuthClientSingleton.instance) {
      BlueskyOAuthClientSingleton.instance = new NodeOAuthClient({
        clientMetadata: BLUE_SKY_CLIENT_META_DATA,
        stateStore: new StateStore(),
        sessionStore: new SessionStore(),
        requestLock,
      });
    }
    return BlueskyOAuthClientSingleton.instance;
  }
}

export const BlueskyOAuthClient = BlueskyOAuthClientSingleton.getInstance();
