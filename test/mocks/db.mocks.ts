export const mockDbSelect = jest.fn().mockReturnThis();
export const mockDbWhere = jest.fn();
export const mockDbUpdate = jest.fn();

export const mockQueryBuilder = {
  select: mockDbSelect,
  where: mockDbWhere,
  update: mockDbUpdate,
};

export const mockDb = jest.fn().mockReturnValue(mockQueryBuilder);

// Helper function to set up successful query
export const setupSuccessfulQuery = (returnValue: unknown[]): void => {
  mockDbWhere.mockResolvedValue(returnValue);
};

// Helper function to set up failed query
export const setupFailedQuery = (error: Error): void => {
  mockDbWhere.mockRejectedValue(error);
};

// Setup function
export const setupDbMocks = (): void => {
  jest.mock('../../src/config/db', () => ({
    db: mockDb,
  }));
};
