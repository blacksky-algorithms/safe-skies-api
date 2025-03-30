import {
  mockedCustomServiceGate,
  mockedReportToBlacksky,
  mockedReportToOzone,
  mockedCreateModerationLog,
} from '../../mocks/moderation.mocks';
import { Request, Response } from 'express';
import {
  createMockRequest,
  createMockResponse,
} from '../../mocks/express.mock';

// import the controller AFTER the modules have been mocked.
import { reportModerationEvents } from '../../../src/controllers/moderation.controller';

describe('reportModerationEvents', () => {
  let req: Request;
  let res: Response;

  beforeEach(() => {
    jest.clearAllMocks();
    req = createMockRequest({
      user: { did: 'did:example:acting', handle: '@acting' },
    });
    res = createMockResponse();
  });

  it('should return 401 if no acting user', async () => {
    req = createMockRequest({ user: undefined });
    await reportModerationEvents(req, res);
    expect(res.status as jest.Mock).toHaveBeenCalledWith(401);
    expect(res.json as jest.Mock).toHaveBeenCalledWith({
      error: 'Unauthorized: No valid session',
    });
  });

  it('should process multiple reports and handle log error in one report', async () => {
    const report1 = {
      targetedPostUri: 'post-uri-1',
      reason: 'Report 1',
      toServices: [{ value: 'blacksky' }],
      targetedUserDid: 'did:example:target1',
      uri: 'report-uri-1',
      feedName: 'feed1',
      additionalInfo: '',
      action: 'post_delete',
      targetedPost: 'content1',
      targetedProfile: {
        did: 'did:example:target1',
        handle: 'target1',
        display_name: 'Target1',
        avatar: 'avatar1.png',
      },
    };

    const report2 = {
      targetedPostUri: 'post-uri-2',
      reason: 'Report 2',
      toServices: [{ value: 'ozone' }],
      targetedUserDid: 'did:example:target2',
      uri: 'report-uri-2',
      feedName: 'feed2',
      additionalInfo: '',
      action: 'mod_promote',
      targetedPost: 'content2',
      targetedProfile: {
        did: 'did:example:target2',
        handle: 'target2',
        display_name: 'Target2',
        avatar: 'avatar2.png',
      },
    };

    req.body = [report1, report2];

    // Ensure the custom service gate passes by forcing it to return true.
    mockedCustomServiceGate.mockResolvedValue(true);
    mockedReportToBlacksky.mockResolvedValue('blackskyResult');
    mockedReportToOzone.mockResolvedValue('ozoneResult');

    // Instead of using call order, base the mock behavior on the log data.
    mockedCreateModerationLog.mockImplementation((logData) => {
      if (logData.uri === 'report-uri-1') {
        return Promise.resolve();
      }
      if (logData.uri === 'report-uri-2') {
        return Promise.reject(new Error('log error'));
      }
      return Promise.resolve();
    });

    await reportModerationEvents(req, res);

    // Cast res.json as jest.Mock to inspect its calls.
    const summary = (res.json as jest.Mock).mock.calls[0][0].summary;
    expect(summary.length).toBe(2);

    const resultForReport1 = summary.find(
      (r: { report: { uri: string } }) => r.report.uri === 'report-uri-1'
    );
    const resultForReport2 = summary.find(
      (r: { report: { uri: string } }) => r.report.uri === 'report-uri-2'
    );

    expect(resultForReport1).toBeDefined();
    expect(resultForReport2).toBeDefined();

    // For report1, createModerationLog succeeded.
    expect(resultForReport1.details).toEqual([
      { service: 'blacksky', result: 'blackskyResult' },
      { service: 'log', result: 'logged' },
    ]);

    // For report2, createModerationLog failed.
    expect(resultForReport2.details).toEqual([
      { service: 'ozone', result: 'ozoneResult' },
      { service: 'log', error: 'log error' },
    ]);
  });
});
