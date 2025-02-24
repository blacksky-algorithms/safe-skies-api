import { AtpAgent } from '@atproto/api';

class AtpAgentSingleton {
  private static instance: AtpAgent;
  private constructor() {}
  public static getInstance(): AtpAgent {
    if (!AtpAgentSingleton.instance) {
      this.instance = new AtpAgent({
        service: process.env.BASE_API_URL!,
      });
    }
    return this.instance;
  }
}

export const AtprotoAgent = AtpAgentSingleton.getInstance();
