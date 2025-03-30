import { Request, Response } from 'express';

// Mock response functions
export const mockJson = jest.fn().mockReturnThis();
export const mockStatus = jest.fn().mockReturnValue({ json: mockJson });
export const mockRedirect = jest.fn().mockReturnThis();
export const mockClearCookie = jest.fn().mockReturnThis();

// Helper functions for creating Express request/response objects
export const createMockRequest = (overrides?: Partial<Request>): Request => {
  return {
    query: {},
    body: {},
    params: {},
    ...overrides,
  } as Request;
};

export const createMockResponse = (): Response => {
  const res: Partial<Response> = {};
  res.status = mockStatus;
  res.json = mockJson;
  res.redirect = mockRedirect;
  res.clearCookie = mockClearCookie;
  return res as Response;
};
