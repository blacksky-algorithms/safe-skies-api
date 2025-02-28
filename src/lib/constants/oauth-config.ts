// src/repos/constants.ts
import { OAuthClientMetadataInput } from '@atproto/oauth-client-node';
import dotenv from 'dotenv';

dotenv.config();

const baseUrl = process.env.BSKY_BASE_URL;

if (!baseUrl) {
  throw new Error('BSKY_BASE_URL environment variable is required');
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
export const BLUE_SKY_CLIENT_META_DATA: OAuthClientMetadataInput = {
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

export const SESSION_CONFIG = {
  cookieName: 'bsky-session',
  password: process.env.SESSION_SECRET!,
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
  },
};
