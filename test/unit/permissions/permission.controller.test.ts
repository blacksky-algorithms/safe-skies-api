import { Request, Response } from 'express';
import {
  createMockRequest,
  createMockResponse,
} from '../../mocks/express.mock';

import {
  promoteModerator,
  demoteModerator,
  listModerators,
  checkFeedRole,
} from '../../../src/controllers/permissions.controller';

// Import our consolidated permissions mocks
import * as permissions from '../../../src/repos/permissions';
import { setupPermissionsMocks } from '../../mocks/permissions.mocks';

import { mockUser } from '../../fixtures/user.fixtures';
import { mockModeratorsList } from '../../fixtures/moderation.fixtures';

describe('Permissions Controller', () => {
  let req: Request;
  let res: Response;

  beforeEach(() => {
    setupPermissionsMocks();
    jest.clearAllMocks();
    res = createMockResponse();
  });

  // Test common validation patterns once
  describe('Common Validations', () => {
    it('should require authentication for all endpoints', async () => {
      req = createMockRequest({ user: undefined });

      // Test each endpoint for authentication requirement
      await promoteModerator(req, res);
      expect(res.status).toHaveBeenCalledWith(401);

      jest.clearAllMocks();
      await demoteModerator(req, res);
      expect(res.status).toHaveBeenCalledWith(401);

      jest.clearAllMocks();
      await listModerators(req, res);
      expect(res.status).toHaveBeenCalledWith(401);

      jest.clearAllMocks();
      await checkFeedRole(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  // Focus on business logic for moderator promotion
  describe('promoteModerator', () => {
    beforeEach(() => {
      req = createMockRequest({
        user: { did: mockUser.did, handle: mockUser.handle },
        body: {
          targetUserDid: 'did:example:target',
          uri: 'feed:1',
          feedName: 'Test Feed',
        },
      });
    });

    it('should promote user to moderator when actor has permission', async () => {
      // Set up permissions
      jest.spyOn(permissions, 'canPerformAction').mockResolvedValue(true);
      jest.spyOn(permissions, 'setFeedRole').mockResolvedValue(true);

      await promoteModerator(req, res);

      // Verify the right functions were called with correct params
      expect(permissions.canPerformAction).toHaveBeenCalledWith(
        mockUser.did,
        'mod_promote',
        'feed:1'
      );
      expect(permissions.setFeedRole).toHaveBeenCalledWith(
        'did:example:target',
        'feed:1',
        'mod',
        mockUser.did,
        'Test Feed'
      );
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    it('should prevent promotion when actor lacks permission', async () => {
      jest.spyOn(permissions, 'canPerformAction').mockResolvedValue(false);

      await promoteModerator(req, res);

      expect(permissions.setFeedRole).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  // Focus on business logic for moderator demotion
  describe('demoteModerator', () => {
    beforeEach(() => {
      req = createMockRequest({
        user: { did: mockUser.did, handle: mockUser.handle },
        body: {
          modDid: 'did:example:mod',
          uri: 'feed:1',
          feedName: 'Test Feed',
        },
      });
    });

    it('should demote moderator when actor has permission', async () => {
      jest.spyOn(permissions, 'canPerformAction').mockResolvedValue(true);
      jest.spyOn(permissions, 'setFeedRole').mockResolvedValue(true);

      await demoteModerator(req, res);

      expect(permissions.canPerformAction).toHaveBeenCalledWith(
        mockUser.did,
        'mod_demote',
        'feed:1'
      );
      expect(permissions.setFeedRole).toHaveBeenCalledWith(
        'did:example:mod',
        'feed:1',
        'user',
        mockUser.did,
        'Test Feed'
      );
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });
  });

  // Test listModerators with different scenarios
  describe('listModerators', () => {
    it('should list moderators for specific feed when user is admin', async () => {
      req = createMockRequest({
        user: { did: mockUser.did, handle: mockUser.handle },
        query: { feed: 'feed:1' },
      });

      jest.spyOn(permissions, 'getFeedRole').mockResolvedValue('admin');
      jest
        .spyOn(permissions, 'fetchFeedModsWithProfiles')
        .mockResolvedValue([
          { moderators: mockModeratorsList, feed: { uri: 'feed:1' } },
        ]);

      await listModerators(req, res);

      expect(permissions.getFeedRole).toHaveBeenCalledWith(
        mockUser.did,
        'feed:1'
      );
      expect(permissions.fetchFeedModsWithProfiles).toHaveBeenCalledWith([
        { uri: 'feed:1' },
      ]);
      expect(res.json).toHaveBeenCalledWith({ moderators: mockModeratorsList });
    });

    it('should list moderators across all admin feeds when no feed specified', async () => {
      req = createMockRequest({
        user: { did: mockUser.did, handle: mockUser.handle },
      });

      jest
        .spyOn(permissions, 'fetchModsForAdminFeeds')
        .mockResolvedValue(mockModeratorsList);

      await listModerators(req, res);

      expect(permissions.fetchModsForAdminFeeds).toHaveBeenCalledWith(
        mockUser.did
      );
      expect(res.json).toHaveBeenCalledWith({ moderators: mockModeratorsList });
    });

    it('should prevent non-admins from viewing feed moderators', async () => {
      req = createMockRequest({
        user: { did: mockUser.did, handle: mockUser.handle },
        query: { feed: 'feed:1' },
      });

      jest.spyOn(permissions, 'getFeedRole').mockResolvedValue('mod');

      await listModerators(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(permissions.fetchFeedModsWithProfiles).not.toHaveBeenCalled();
    });
  });

  // Test checkFeedRole functionality
  describe('checkFeedRole', () => {
    it('should return target user role when actor is admin', async () => {
      req = createMockRequest({
        user: { did: mockUser.did, handle: mockUser.handle },
        query: { targetDid: 'did:example:target', uri: 'feed:1' },
      });

      // Mock sequential calls to getFeedRole
      jest
        .spyOn(permissions, 'getFeedRole')
        .mockResolvedValueOnce('admin') // First call: acting user is admin
        .mockResolvedValueOnce('mod'); // Second call: target user is mod

      await checkFeedRole(req, res);

      expect(permissions.getFeedRole).toHaveBeenCalledTimes(2);
      expect(permissions.getFeedRole).toHaveBeenNthCalledWith(
        1,
        mockUser.did,
        'feed:1'
      );
      expect(permissions.getFeedRole).toHaveBeenNthCalledWith(
        2,
        'did:example:target',
        'feed:1'
      );
      expect(res.json).toHaveBeenCalledWith({ role: 'mod' });
    });

    it('should prevent non-admins from checking roles', async () => {
      req = createMockRequest({
        user: { did: mockUser.did, handle: mockUser.handle },
        query: { targetDid: 'did:example:target', uri: 'feed:1' },
      });

      jest.spyOn(permissions, 'getFeedRole').mockResolvedValue('mod');

      await checkFeedRole(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(permissions.getFeedRole).toHaveBeenCalledTimes(1);
    });
  });
});
