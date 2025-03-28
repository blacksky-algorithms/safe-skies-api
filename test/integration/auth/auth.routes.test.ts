import request from 'supertest';
import app from '../../../src/app';

describe('Auth Routes Integration', () => {
  describe('GET /auth/signin', () => {
    it('should return 400 when handle is missing', async () => {
      const res = await request(app).get('/auth/signin');
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'Handle is required' });
    });

    it('should return an authorization URL when handle is provided', async () => {
      const res = await request(app)
        .get('/auth/signin')
        .query({ handle: 'testHandle' });
      expect(res.status).toBe(200);
      expect(typeof res.body.url).toBe('string');
      expect(res.body.url).toMatch(/^https?:\/\//);
    });
  });

  describe('GET /auth/callback', () => {
    beforeAll(() => {
      process.env.JWT_SECRET = 'secret';
      process.env.CLIENT_URL = 'http://client.com';
    });

    it('should process a valid callback and redirect with a token', async () => {
      const res = await request(app)
        .get('/auth/callback')
        .query({ code: 'validCode', state: 'validState' });
      expect(res.status).toBe(302);
      expect(res.headers.location).toContain(process.env.CLIENT_URL);
      expect(res.headers.location).toMatch(/token=.+/);
    });

    it('should redirect to login with an error on callback failure', async () => {
      // Suppress expected error logs
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const res = await request(app)
        .get('/auth/callback')
        .query({ code: 'fail', state: 'any' });
      expect(res.status).toBe(302);
      expect(res.headers.location).toContain('/oauth/login');
      // Decode the error parameter for comparison.
      const url = new URL(res.headers.location);
      const errorParam = url.searchParams.get('error') || '';
      expect(decodeURIComponent(errorParam)).toMatch(/Test error/);

      consoleErrorSpy.mockRestore();
    });
  });

  describe('POST /auth/logout', () => {
    it('should clear the session token and return a success message', async () => {
      const res = await request(app).post('/auth/logout');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        success: true,
        message: 'Logged out successfully',
      });
    });
  });
});

describe('Auth Routes Integration - Callback Failure Scenarios', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'secret';
    process.env.CLIENT_URL = 'http://client.com';
  });
  let consoleErrorSpy: jest.SpyInstance;
  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Remove any failure flags after each test.
    delete process.env.SAVE_PROFILE_FAIL;
    delete process.env.GET_PROFILE_FAIL;
    consoleErrorSpy.mockRestore();
    jest.restoreAllMocks();
  });

  it('should redirect to login if saving profile data fails', async () => {
    process.env.SAVE_PROFILE_FAIL = 'true';

    const res = await request(app)
      .get('/auth/callback')
      .query({ code: 'validCode', state: 'validState' });

    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('/oauth/login');
    const url = new URL(res.headers.location);
    const errorParam = url.searchParams.get('error') || '';
    expect(decodeURIComponent(errorParam)).toMatch(
      /Failed to save profile data/
    );
  });

  it('should redirect to login if complete profile is not retrieved', async () => {
    // Simulate getProfile failure.
    process.env.GET_PROFILE_FAIL = 'true';

    const res = await request(app)
      .get('/auth/callback')
      .query({ code: 'validCode', state: 'validState' });

    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('/oauth/login');
    const url = new URL(res.headers.location);
    const errorParam = url.searchParams.get('error') || '';
    expect(decodeURIComponent(errorParam)).toMatch(
      /Failed to retrieve complete profile/
    );
  });

  it('should redirect to login if JWT_SECRET is missing', async () => {
    // Ensure other steps succeed.
    const originalSecret = process.env.JWT_SECRET;
    delete process.env.JWT_SECRET;

    const res = await request(app)
      .get('/auth/callback')
      .query({ code: 'validCode', state: 'validState' });

    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('/oauth/login');
    const url = new URL(res.headers.location);
    const errorParam = url.searchParams.get('error') || '';
    expect(decodeURIComponent(errorParam)).toMatch(
      /Missing JWT_SECRET environment variable/
    );

    process.env.JWT_SECRET = originalSecret;
  });
});
