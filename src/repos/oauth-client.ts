// src/repos/oauth-client.ts
import { NodeOAuthClient } from '@atproto/oauth-client-node';
import { Mutex } from 'async-mutex';
import { StateStore, SessionStore } from './storage';
import { BLUE_SKY_CLIENT_META_DATA } from '../lib/constants/oauth-config';

const mutex = new Mutex();
const requestLock = async <T>(
  _name: string,
  fn: () => T | Promise<T> | PromiseLike<T>
): Promise<T> => {
  return await mutex.runExclusive(() => Promise.resolve(fn()));
};

export const BlueskyOAuthClient = new NodeOAuthClient({
  clientMetadata: BLUE_SKY_CLIENT_META_DATA,
  stateStore: new StateStore(),
  sessionStore: new SessionStore(),
  requestLock,
});
