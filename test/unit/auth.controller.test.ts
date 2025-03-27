import { Request, Response } from 'express';
import {
  signin,
  logout,
  callback,
} from '../../src/controllers/auth.controller';

jest.mock('../../src/repos/oauth-client', () => {
  const { mockBlueskyOAuthClient } = require('../mocks/auth.mocks');
  return {
    BlueskyOAuthClient: mockBlueskyOAuthClient,
  };
});

jest.mock('../../src/repos/atproto', () => {
  const {
    mockAtprotoAgent,
    mockGetActorFeeds,
  } = require('../mocks/auth.mocks');
  return {
    AtprotoAgent: mockAtprotoAgent,
    getActorFeeds: mockGetActorFeeds,
  };
});

jest.mock('../../src/repos/profile', () => {
  const { mockGetProfile, mockSaveProfile } = require('../mocks/auth.mocks');
  return {
    getProfile: mockGetProfile,
    saveProfile: mockSaveProfile,
  };
});

jest.mock('jsonwebtoken', () => {
  const { mockJwtSign } = require('../mocks/auth.mocks');
  return {
    sign: mockJwtSign,
  };
});

// Helper functions for creating Express request/response objects.
const createMockRequest = (overrides?: Partial<Request>): Request => {
  return {
    query: {},
    body: {},
    params: {},
    ...overrides,
  } as Request;
};

const createMockResponse = (): Response => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.redirect = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  return res as Response;
};

describe('Auth Controller', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('signin', () => {
    it('should return 400 if handle is missing', async () => {
      const req = createMockRequest();
      const res = createMockResponse();

      await signin(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Handle is required' });
    });

    it('should call BlueskyOAuthClient.authorize and return the URL if handle is provided', async () => {
      const req = createMockRequest({ query: { handle: 'testHandle' } });
      const res = createMockResponse();
      const fakeUrl = new URL('http://example.com');

      const { mockBlueskyOAuthClient } = require('../mocks/auth.mocks');
      mockBlueskyOAuthClient.authorize.mockResolvedValue(fakeUrl);

      await signin(req, res);

      expect(mockBlueskyOAuthClient.authorize).toHaveBeenCalledWith(
        'testHandle'
      );
      expect(res.json).toHaveBeenCalledWith({ url: fakeUrl.toString() });
    });
  });

  describe('logout', () => {
    it('should clear the session_token cookie and return a success message', async () => {
      const req = createMockRequest();
      const res = createMockResponse();
      process.env.NODE_ENV = 'development';

      await logout(req, res);

      expect(res.clearCookie).toHaveBeenCalledWith('session_token', {
        httpOnly: true,
        secure: false,
        sameSite: 'strict',
      });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Logged out successfully',
      });
    });
  });

  describe('callback', () => {
    beforeEach(() => {
      process.env.JWT_SECRET = 'secret';
      process.env.CLIENT_URL = 'http://client.com';
    });

    it('should process a valid callback and redirect with a token', async () => {
      const req = createMockRequest({ query: { code: 'abc', state: '123' } });
      const res = createMockResponse();
      const {
        mockBlueskyOAuthClient,
        mockAtprotoAgent,
        mockGetActorFeeds,
        mockGetProfile,
        mockSaveProfile,
        mockJwtSign,
      } = require('../mocks/auth.mocks');

      const fakeSession = { sub: 'did:example:123' };
      mockBlueskyOAuthClient.callback.mockResolvedValue({
        session: fakeSession,
      });

      const fakeProfileData = {
        did: 'did:example:123',
        handle: 'testHandle',
        displayName: 'Test User',
      };
      mockAtprotoAgent.getProfile.mockResolvedValue({
        success: true,
        data: fakeProfileData,
      });
      const fakeFeeds = {
        feeds: [
          {
            uri: 'feed:1',
            displayName: 'Feed One',
            creator: { did: 'admin1' },
          },
        ],
      };
      mockGetActorFeeds.mockResolvedValue(fakeFeeds);
      mockSaveProfile.mockResolvedValue(true);
      mockGetProfile.mockResolvedValue(fakeProfileData);
      mockJwtSign.mockReturnValue('fake.jwt.token');

      await callback(req, res);

      expect(res.redirect).toHaveBeenCalled();
      const redirectUrl = (res.redirect as jest.Mock).mock.calls[0][0];
      expect(redirectUrl).toContain(process.env.CLIENT_URL);
      expect(redirectUrl).toContain('token=fake.jwt.token');
    });

    it('should redirect to login with error on failure', async () => {
      const req = createMockRequest({ query: { code: 'abc', state: '123' } });
      const res = createMockResponse();
      process.env.CLIENT_URL = 'http://client.com';
      const { mockBlueskyOAuthClient } = require('../mocks/auth.mocks');

      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      mockBlueskyOAuthClient.callback.mockRejectedValue(
        new Error('Test error')
      );

      await callback(req, res);

      expect(res.redirect).toHaveBeenCalled();
      const redirectUrl = (res.redirect as jest.Mock).mock.calls[0][0];
      expect(redirectUrl).toContain('http://client.com/oauth/login');
      expect(redirectUrl).toContain(encodeURIComponent('Test error'));

      consoleSpy.mockRestore();
    });
  });
});
