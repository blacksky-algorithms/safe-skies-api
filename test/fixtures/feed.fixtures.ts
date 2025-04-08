import { GeneratorView } from '@atproto/api/dist/client/types/app/bsky/feed/defs';
import { DEFAULT_FEED } from '../../src/lib/constants';
import { mockActingAdminUser, mockNotActingAdminUser } from './user.fixtures';

// Mock data for getEnrichedFeedsForUser
export const mockEnrichedFeedData = {
  feeds: [
    {
      uri: 'feed:1',
      displayName: 'BlueSky Admin Feed 1',
      description: 'Admin description 1',
      type: 'admin',
    },
    {
      uri: 'feed:2',
      displayName: 'Admin Feed 2',
      description: 'Admin description 2',
      type: 'admin',
    },
    {
      uri: 'feed:3',
      displayName: 'Test Feed',
      description: 'Test Description',
      type: 'mod',
    },
  ],
  defaultFeed: DEFAULT_FEED,
};

export const mockGeneratorView: GeneratorView = {
  uri: 'feed:1',
  cid: 'cid1',
  did: 'did1',
  creator: {
    ...mockActingAdminUser,
  },
  displayName: 'Feed One',
  indexedAt: '2025-03-24T00:00:00.000Z',
};

export const mockGeneratorViewNoDisplayName: GeneratorView = {
  ...mockGeneratorView,
  uri: 'feed:2',
  displayName: '',
};

export const mockFeedsByRole = {
  admin: [
    {
      uri: 'feed:1',
      feed_name: 'Admin Feed 1',
      admin_did: mockActingAdminUser.did,
    },
    {
      uri: 'feed:2',
      feed_name: 'Admin Feed 2',
      admin_did: mockActingAdminUser.did,
    },
  ],
  mod: [
    {
      uri: 'feed:3',
      feed_name: 'Mod Feed 1',
      admin_did: mockNotActingAdminUser.did,
    },
  ],
  user: [],
};

export const mockAdminFeedByRole = {
  uri: 'feed1',
  feed_name: 'Feed One',
  admin_did: mockActingAdminUser.did,
};
