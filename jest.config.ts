import type { Config } from 'jest';

const config: Config = {
  verbose: true,
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'], // Ensure your setup file is included
  moduleNameMapper: {
    '^@src/(.*)$': '<rootDir>/src/$1', // Path alias for src if needed
  },
  collectCoverage: true,
  collectCoverageFrom: ['<rootDir>/src/**/*.ts'], // Recursively collect coverage from src folder onwards
  coverageDirectory: '<rootDir>/coverage', // Set the output directory for coverage reports
  coverageReporters: ['text', 'lcov'],
  testMatch: ['<rootDir>/tests/**/*.test.ts'], // Match all test files in test folder
};

export default config;

