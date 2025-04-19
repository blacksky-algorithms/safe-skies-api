import { authenticateJWT } from "../../../src/middleware/auth.middleware";
import {
	createMockRequest,
	createMockResponse,
} from "../../mocks/express.mock";
import jwt from "jsonwebtoken";
import { mockUser } from "../../fixtures/user.fixtures";
import { mockInvalidToken, mockToken } from "../../fixtures/auth.fixtures";

// Mock jwt.verify directly
jest.mock("jsonwebtoken", () => ({
	verify: jest.fn(),
}));

describe("authenticateJWT middleware", () => {
	// Setup the mock next function
	const next = jest.fn();

	// Store original environment
	const originalEnv = process.env;

	beforeEach(() => {
		// Reset mocks
		jest.clearAllMocks();

		// Restore environment for each test
		process.env = { ...originalEnv };
		process.env.JWT_SECRET = "test-secret";
	});

	afterAll(() => {
		// Restore environment
		process.env = originalEnv;
	});

	it("should call next() when token is valid", () => {
		// Mock successful token verification
		(jwt.verify as jest.Mock).mockReturnValue(mockUser);

		// Create request with valid token
		const req = createMockRequest({
			headers: {
				authorization: `Bearer ${mockToken}`,
			},
		});

		const res = createMockResponse();

		// Call middleware
		authenticateJWT(req, res, next);

		// Check that token was verified with correct parameters
		expect(jwt.verify).toHaveBeenCalledWith(mockToken, "test-secret");

		// User should be added to request
		expect(req.user).toEqual(mockUser);

		// Next should be called
		expect(next).toHaveBeenCalled();
	});

	it("should return 401 when no token is provided", () => {
		// Request with empty headers object (not undefined)
		const req = createMockRequest({
			headers: {},
		});
		const res = createMockResponse();

		// Call middleware
		authenticateJWT(req, res, next);

		// Verify response
		expect(res.status).toHaveBeenCalledWith(401);
		expect(res.json).toHaveBeenCalledWith({
			error: "Unauthorized: No token provided",
		});

		// Next should not be called
		expect(next).not.toHaveBeenCalled();
	});

	it("should return 401 when token is invalid", () => {
		// Mock token verification failure
		(jwt.verify as jest.Mock).mockImplementation(() => {
			throw new Error("Invalid token");
		});

		// Create request with invalid token
		const req = createMockRequest({
			headers: {
				authorization: `Bearer ${mockInvalidToken}`,
			},
		});

		const res = createMockResponse();

		// Mock console.error to prevent test output pollution
		const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

		// Call middleware
		authenticateJWT(req, res, next);

		// Verify response
		expect(res.status).toHaveBeenCalledWith(401);
		expect(res.json).toHaveBeenCalledWith({
			error: "Unauthorized: Invalid token",
		});

		// Next should not be called
		expect(next).not.toHaveBeenCalled();

		// Verify error was logged
		expect(consoleErrorSpy).toHaveBeenCalled();

		// Restore console.error
		consoleErrorSpy.mockRestore();
	});

	it("should return 401 when JWT_SECRET is missing", () => {
		// Remove JWT_SECRET
		delete process.env.JWT_SECRET;

		// Create request with valid token
		const req = createMockRequest({
			headers: {
				authorization: `Bearer ${mockToken}`,
			},
		});

		const res = createMockResponse();

		// Mock console.error to prevent test output pollution
		const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

		// Call middleware
		authenticateJWT(req, res, next);

		// Verify response
		expect(res.status).toHaveBeenCalledWith(401);
		expect(res.json).toHaveBeenCalledWith({
			error: "Unauthorized: Invalid token",
		});

		// Next should not be called
		expect(next).not.toHaveBeenCalled();

		// Restore console.error
		consoleErrorSpy.mockRestore();
	});

	it("should handle malformed authorization header", () => {
		// Authorization header without token
		const req = createMockRequest({
			headers: {
				authorization: "Bearer",
			},
		});

		const res = createMockResponse();

		// Mock console.error to prevent test output pollution
		const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

		// Call middleware
		authenticateJWT(req, res, next);

		// Verify response
		expect(res.status).toHaveBeenCalledWith(401);
		expect(res.json).toHaveBeenCalledWith({
			error: "Unauthorized: No token provided",
		});

		// Next should not be called
		expect(next).not.toHaveBeenCalled();

		// Restore console.error
		consoleErrorSpy.mockRestore();
	});
});
