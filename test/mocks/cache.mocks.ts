/**
 * Returns a new object representing a mocked NodeCache instance.
 */
export const createMockCache = (): {
	get: jest.Mock;
	set: jest.Mock;
} => {
	return {
		get: jest.fn(),
		set: jest.fn(),
	};
};

export const mockCacheGet = jest.fn();
export const mockCacheSet = jest.fn();

/**
 * Mocks the 'node-cache' module so that every new instance returns a controlled mock.
 */
export const setupNodeCacheMocks = (): void => {
	jest.mock("node-cache", () => {
		return jest.fn().mockImplementation(() => ({
			get: mockCacheGet,
			set: mockCacheSet,
		}));
	});
};
