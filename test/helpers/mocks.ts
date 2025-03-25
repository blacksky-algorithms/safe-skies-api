import { ModerationService } from '../../src/lib/types/moderation';

// Use your actual type for ModerationService.
export const mockServicesConfig: ModerationService[] = [
  {
    value: 'ozone',
    label: 'Ozone',
    feed_gen_endpoint: null,
    admin_did: 'admin1',
  },
  {
    value: 'custom',
    label: 'Custom Service',
    feed_gen_endpoint: 'http://example.com',
    admin_did: 'admin2',
  },
];

// A mock implementation for getModerationServicesConfig that returns our fixed configuration.
export const mockGetModerationServicesConfig = async (): Promise<
  ModerationService[]
> => {
  return mockServicesConfig;
};

// A mock implementation for computeAllowedServicesForFeed.
// It uses the admin_did to determine allowed services.
export const mockComputeAllowedServicesForFeed = jest.fn(
  async (
    adminDid: string,
    servicesConfig: ModerationService[]
  ): Promise<string[]> => {
    // Always include 'ozone' by default.
    // If adminDid matches 'admin1', also include 'custom', otherwise just return ['ozone'].
    if (adminDid === 'admin1') {
      return ['ozone', 'custom'];
    }
    return ['ozone'];
  }
);
