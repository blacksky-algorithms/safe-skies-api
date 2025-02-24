// src/lib/oauth-client.ts
import { NodeOAuthClient, type OAuthSession } from '@atproto/oauth-client-node';
import { AtpAgent, AtpAgentLoginOpts } from '@atproto/api';

type BlueskySession = {
  did: string;
  handle: string;
  accessToken: string;
  refreshToken: string;
  dpopKey: JsonWebKey;
  expiresAt: Date;
};

export class BlueskyAuth {
  private oauthClient: NodeOAuthClient;
  private agent: AtpAgent;

  constructor(
    private config: {
      service: string;
      clientMetadataUrl: string;
      redirectUri: string;
      cookieSecret: string;
    }
  ) {
    this.oauthClient = new NodeOAuthClient({
      clientMetadata: { ...config.clientMetadataUrl },
    });

    this.agent = new AtpAgent({ service: config.service });
  }

  async handleCallback(params: URLSearchParams): Promise<BlueskySession> {
    const session = await this.oauthClient.callback(
      this.config.redirectUri,
      params
    );
    return this.createSession(session);
  }

  private async createSession(
    oauthSession: OAuthSession
  ): Promise<BlueskySession> {
    const tokenSet = oauthSession.getTokenSet();

    // Configure agent with DPoP
    this.agent.configure({
      accessToken: tokenSet.access_token,
      dpopKey: await this.oauthClient.importDpopKeyPair(oauthSession),
    });

    // Validate and get profile
    const profile = await this.agent.api.app.bsky.actor.getProfile({
      actor: oauthSession.sub,
    });

    return {
      did: oauthSession.sub,
      handle: profile.data.handle,
      accessToken: tokenSet.access_token,
      refreshToken: tokenSet.refresh_token,
      dpopKey: oauthSession.dpopKey.jwk,
      expiresAt: new Date(tokenSet.expires_at),
    };
  }

  async refreshSession(session: BlueskySession): Promise<BlueskySession> {
    const newSession = await this.oauthClient.refreshSession({
      refresh_token: session.refreshToken,
      dpopKey: await this.oauthClient.importDpopKey(session.dpopKey),
    });

    return this.createSession(newSession);
  }
}
