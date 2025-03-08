"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_FEED = exports.ROLE_PRIORITY = exports.preferredLanguages = void 0;
exports.preferredLanguages = 'en-US, en';
exports.ROLE_PRIORITY = {
    admin: 3,
    mod: 2,
    user: 1,
};
exports.DEFAULT_FEED = {
    uri: 'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/whats-hot',
    displayName: "What's Hot",
    type: 'user',
};
