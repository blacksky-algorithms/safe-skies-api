import {
  Report,
  ModerationService,
  ModAction,
} from '../../src/lib/types/moderation';

// Sample moderation services for testing
export const sampleModerationServices: ModerationService[] = [
  {
    value: 'blacksky',
    label: 'Blacksky Moderation',
    feed_gen_endpoint: 'http://example.com',
    admin_did: 'admin1',
  },
  {
    value: 'ozone',
    label: 'Ozone Moderation',
    feed_gen_endpoint: null,
    admin_did: 'admin2',
  },
];

// Sample report options for testing
export const sampleReportOptions = [
  { id: 'spam', title: 'Spam', description: 'Spam', reason: 'Spam' },
  {
    id: 'harassment',
    title: 'Harassment',
    description: 'Harassment',
    reason: 'Harassment',
  },
];

// Sample report for testing
export const sampleReport: Report = {
  targetedPostUri: 'at://did:example:post/123',
  reason: 'spam',
  toServices: sampleModerationServices,
  targetedUserDid: 'did:example:target',
  uri: 'feed:1',
  feedName: 'Test Feed',
  additionalInfo: 'Test info',
  action: 'post_report' as ModAction,
  targetedPost: 'Problematic post content',
  targetedProfile: 'Target User',
};

// Sample reports array for multiple report testing
export const sampleReports: Report[] = [
  {
    targetedPostUri: 'at://did:example:post/123',
    reason: 'spam',
    uri: 'feed:1',
    toServices: [sampleModerationServices[0]],
    targetedUserDid: 'did:example:target',
    feedName: 'Test Feed',
    additionalInfo: '',
    action: 'post_report' as ModAction,
    targetedPost: 'Post content 1',
    targetedProfile: 'User profile 1',
  },
  {
    targetedPostUri: 'at://did:example:post/456',
    reason: 'harassment',
    uri: 'feed:1',
    toServices: [sampleModerationServices[1]],
    targetedUserDid: 'did:example:target2',
    feedName: 'Test Feed',
    additionalInfo: '',
    action: 'post_report' as ModAction,
    targetedPost: 'Post content 2',
    targetedProfile: 'User profile 2',
  },
];

// Sample acting user
export const sampleActingUser = {
  did: 'did:example:acting',
  handle: '@acting',
};
