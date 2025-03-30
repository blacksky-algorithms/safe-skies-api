jest.mock('../../src/repos/permissions', () => ({
  customServiceGate: jest.fn(),
}));

jest.mock('../../src/repos/moderation', () => ({
  fetchReportOptions: jest.fn(),
  fetchModerationServices: jest.fn(),
  reportToBlacksky: jest.fn(),
  reportToOzone: jest.fn(),
}));

jest.mock('../../src/repos/logs', () => ({
  createModerationLog: jest.fn(),
}));

// Import the actual functions so we can cast them as mocks.
import { customServiceGate } from '../../src/repos/permissions';
import { reportToBlacksky, reportToOzone } from '../../src/repos/moderation';
import { createModerationLog } from '../../src/repos/logs';
import { ModeratorData } from '../../src/lib/types/user';

// Export the mocks for use in tests.
export const mockedCustomServiceGate = customServiceGate as jest.Mock;
export const mockedReportToBlacksky = reportToBlacksky as jest.Mock;
export const mockedReportToOzone = reportToOzone as jest.Mock;
export const mockedCreateModerationLog = createModerationLog as jest.Mock;

export const moderators: ModeratorData[] = [
  {
    did: 'mod1',
    role: 'mod',
    uri: 'feed:1',
    profile: {
      did: 'mod1',
      handle: '@mod1',
    },
  },
  {
    did: 'mod2',
    role: 'mod',
    uri: 'feed:1',
    profile: {
      did: 'mod2',
      handle: '@mod2',
    },
  },
  {
    did: 'mod3',
    role: 'mod',
    uri: 'feed:3',
    profile: {
      did: 'mod3',
      handle: '@mod3',
    },
  },
];
