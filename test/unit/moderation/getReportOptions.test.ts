import { Request, Response } from 'express';
import { getReportOptions } from '../../../src/controllers/moderation.controller';
import { fetchReportOptions } from '../../../src/repos/moderation';

// Mock the dependency.
jest.mock('../../../src/repos/moderation', () => ({
  fetchReportOptions: jest.fn(),
  fetchModerationServices: jest.fn(),
  reportToBlacksky: jest.fn(),
  reportToOzone: jest.fn(),
}));

const mockedFetchReportOptions = fetchReportOptions as jest.Mock;

describe('getReportOptions', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    req = {} as Request;
    statusMock = jest.fn().mockReturnThis();
    jsonMock = jest.fn();
    res = { status: statusMock, json: jsonMock } as unknown as Response;
    jest.clearAllMocks();
  });

  it('should return report options with status 200', async () => {
    const options = ['option1', 'option2'];
    mockedFetchReportOptions.mockResolvedValueOnce(options);

    await getReportOptions(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({ options });
  });

  it('should handle errors and return 500', async () => {
    mockedFetchReportOptions.mockRejectedValueOnce(new Error('test error'));

    await getReportOptions(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Internal server error' });
  });
});
