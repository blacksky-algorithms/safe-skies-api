"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BLUE_SKY_CLIENT_META_DATA = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const baseUrl = process.env.BASE_URL;
if (!baseUrl) {
    throw new Error('BASE_URL environment variable is required');
}
// export const BLUE_SKY_CLIENT_META_DATA: OAuthClientMetadataInput = {
//   client_name: `${baseUrl}`,
//   client_id: `${baseUrl}/oauth/client-metadata.json`,
//   client_uri: `${baseUrl}`,
//   redirect_uris: [`${baseUrl}`],
//   // policy_uri: `${baseUrl}/policy`,
//   // tos_uri: `${baseUrl}/tos`,
//   scope: 'atproto transition:generic',
//   grant_types: ['authorization_code', 'refresh_token'],
//   response_types: ['code'],
//   application_type: 'web',
//   token_endpoint_auth_method: 'none',
//   dpop_bound_access_tokens: true,
// };
// Bluesky OAuth Metadata
exports.BLUE_SKY_CLIENT_META_DATA = {
    client_name: `${baseUrl}`,
    client_id: `${baseUrl}/oauth/client-metadata.json`,
    client_uri: `${baseUrl}`,
    redirect_uris: [`${baseUrl}/auth/callback`],
    policy_uri: `${baseUrl}/policy`,
    tos_uri: `${baseUrl}/tos`,
    scope: 'atproto transition:generic',
    grant_types: ['authorization_code', 'refresh_token'],
    response_types: ['code'],
    application_type: 'web',
    token_endpoint_auth_method: 'none',
    dpop_bound_access_tokens: true,
};
