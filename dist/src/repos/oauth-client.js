"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlueskyOAuthClient = void 0;
const async_mutex_1 = require("async-mutex");
const oauth_client_node_1 = require("@atproto/oauth-client-node");
const oauth_config_1 = require("../lib/constants/oauth-config");
const storage_1 = require("./storage");
const mutex = new async_mutex_1.Mutex();
const requestLock = async (_name, fn) => {
    return await mutex.runExclusive(() => Promise.resolve(fn()));
};
class BlueskyOAuthClientSingleton {
    constructor() { }
    static getInstance() {
        if (!BlueskyOAuthClientSingleton.instance) {
            BlueskyOAuthClientSingleton.instance = new oauth_client_node_1.NodeOAuthClient({
                clientMetadata: oauth_config_1.BLUE_SKY_CLIENT_META_DATA,
                stateStore: new storage_1.StateStore(),
                sessionStore: new storage_1.SessionStore(),
                requestLock,
            });
        }
        return BlueskyOAuthClientSingleton.instance;
    }
}
exports.BlueskyOAuthClient = BlueskyOAuthClientSingleton.getInstance();
