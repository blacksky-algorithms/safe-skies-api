import { AtpAgent } from '@atproto/api';

class AtpAgentSingleton {
  private static instance: AtpAgent;
  private constructor() {}
  public static getInstance(): AtpAgent {
    if (!AtpAgentSingleton.instance) {
      AtpAgentSingleton.instance = new AtpAgent({
        service: process.env.BASE_API_URL!, // e.g. "https://bsky.social"
      });
    }
    return AtpAgentSingleton.instance;
  }
}

export const AtprotoAgent = AtpAgentSingleton.getInstance();
