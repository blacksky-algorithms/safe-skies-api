"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AtprotoAgent = void 0;
const api_1 = require("@atproto/api");
class AtpAgentSingleton {
    constructor() { }
    static getInstance() {
        if (!AtpAgentSingleton.instance) {
            this.instance = new api_1.AtpAgent({
                service: process.env.BSKY_BASE_API_URL,
            });
        }
        return this.instance;
    }
}
exports.AtprotoAgent = AtpAgentSingleton.getInstance();
