import {
  mockBlueskyOAuthClient,
  mockAtprotoAgent,
  mockGetActorFeeds,
  mockGetProfile,
  mockSaveProfile,
  mockJwtSign,
  setupAuthMocks,
} from '../../mocks/auth.mocks';

setupAuthMocks();

// Import controllers after setting up mocks
import {
  signin,
  logout,
  callback,
} from '../../../src/controllers/auth.controller';
import {
  createMockRequest,
  createMockResponse,
} from '../../mocks/express.mock';

describe('Auth Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
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

      mockBlueskyOAuthClient.authorize.mockResolvedValueOnce(fakeUrl);

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

      const fakeSession = { session: { sub: 'did:example:123' } };
      mockBlueskyOAuthClient.callback.mockResolvedValueOnce(fakeSession);

      const fakeProfileData = {
        did: 'did:example:123',
        handle: 'testHandle',
        displayName: 'Test User',
      };

      mockAtprotoAgent.getProfile.mockResolvedValueOnce({
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

      mockGetActorFeeds.mockResolvedValueOnce(fakeFeeds);
      mockSaveProfile.mockResolvedValueOnce(true);
      mockGetProfile.mockResolvedValueOnce(fakeProfileData);
      mockJwtSign.mockReturnValueOnce('fake.jwt.token');

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

      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      mockBlueskyOAuthClient.callback.mockRejectedValueOnce(
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
