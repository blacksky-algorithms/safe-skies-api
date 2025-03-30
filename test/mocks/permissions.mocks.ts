import { ModerationService } from '../../src/lib/types/moderation';

// Reusable sample configuration for moderation services.
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

/**
 * Setup function to mock the moderation services module
 */
export const setupPermissionsMocks = (): void => {
  jest.mock('../../src/repos/moderation', () => {
    return {
      getModerationServicesConfig: jest
        .fn()
        .mockResolvedValue(mockServicesConfig),
    };
  });
};
