// jest.config.ts
import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
  moduleFileExtensions: ['ts', 'js'],
  rootDir: '.',
  testMatch: ['**/__tests__/**/*.test.(ts|js)'],
  verbose: true,
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
};

export default config;
