import { GeneratorView } from '@atproto/api/dist/client/types/app/bsky/feed/defs';
import { ExistingPermission } from '../../src/lib/types/permission';

export const sampleGeneratorView: GeneratorView = {
  uri: 'feed:1',
  cid: 'cid1',
  did: 'did1',
  creator: {
    did: 'admin1',
    displayName: 'Admin One',
    handle: '@admin1',
  },
  displayName: 'Feed One',
  indexedAt: '2025-03-24T00:00:00.000Z',
};

export const sampleGeneratorViewNoDisplayName: GeneratorView = {
  ...sampleGeneratorView,
  uri: 'feed:2',
  displayName: '',
};

export const sampleExistingPermission: ExistingPermission = {
  uri: 'feed:3',
  feed_name: 'Existing Feed',
  role: 'mod',
  admin_did: 'admin2',
};

export const sampleModerationServices = [
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
