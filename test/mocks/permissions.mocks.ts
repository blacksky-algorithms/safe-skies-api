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

// A mock implementation for getModerationServicesConfig that returns our fixed configuration.
export const mockGetModerationServicesConfig = async (): Promise<
  ModerationService[]
> => {
  return mockServicesConfig;
};

/**
 * Returns a new object representing a mocked NodeCache instance.
 */
export const createMockCache = (): {
  get: jest.Mock;
  set: jest.Mock;
} => {
  return {
    get: jest.fn(),
    set: jest.fn(),
  };
};

/**
 * Mocks the 'node-cache' module so that every new instance returns a controlled mock.
 */
export const mockNodeCache = (): void => {
  jest.mock('node-cache', () => {
    return jest.fn().mockImplementation(() => createMockCache());
  });
};

/**
 * Create a mock for the db function that simulates a successful query.
 *
 * @param fakeServices - The fake data to return from the query.
 */
export const createMockDb = <T>(fakeServices: T): jest.Mock => {
  return jest.fn().mockImplementation(() => ({
    select: jest.fn().mockResolvedValue(fakeServices),
  }));
};

/**
 * Create a mock for the db function that simulates a query failure.
 *
 * @param error - The error to reject with.
 */
export const createMockDbReject = (error: Error): jest.Mock => {
  return jest.fn().mockImplementation(() => ({
    select: jest.fn().mockRejectedValue(error),
  }));
};
