import { mockServicesConfig } from '../fixtures/moderation.fixtures';

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
