import { Request, Response } from "express";
interface CustomRequest extends Request {
	user: {
		did: string;
		handle: string;
	};
}

// Mock response functions
export const mockJson = jest.fn().mockReturnThis();
export const mockStatus = jest.fn().mockReturnValue({ json: mockJson });
export const mockRedirect = jest.fn().mockReturnThis();
export const mockClearCookie = jest.fn().mockReturnThis();

// Helper functions for creating Express request/response objects
export const createMockRequest = (
	overrides?: Partial<CustomRequest>,
): Request => {
	return {
		cookies: {},
		query: {},
		body: {},
		params: {},
		...overrides,
	} as CustomRequest;
};

export const createMockResponse = (): Response => {
	const res: Partial<Response> = {};
	res.status = mockStatus;
	res.json = mockJson;
	res.redirect = mockRedirect;
	res.clearCookie = mockClearCookie;
	return res as Response;
};
