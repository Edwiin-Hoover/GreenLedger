const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/frontend/$1',
    '^@/components/(.*)$': '<rootDir>/frontend/components/$1',
    '^@/pages/(.*)$': '<rootDir>/frontend/pages/$1',
    '^@/styles/(.*)$': '<rootDir>/frontend/styles/$1',
    '^@/utils/(.*)$': '<rootDir>/frontend/utils/$1',
    '^@/hooks/(.*)$': '<rootDir>/frontend/hooks/$1',
    '^@/types/(.*)$': '<rootDir>/frontend/types/$1',
    '^@/contracts/(.*)$': '<rootDir>/contracts/$1',
    '^@/backend/(.*)$': '<rootDir>/backend/$1',
  },
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/contracts/',
  ],
  collectCoverageFrom: [
    'frontend/**/*.{js,jsx,ts,tsx}',
    '!frontend/**/*.d.ts',
    '!frontend/pages/_app.tsx',
    '!frontend/pages/_document.tsx',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  testMatch: [
    '<rootDir>/tests/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/frontend/**/*.test.{js,jsx,ts,tsx}',
  ],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  transformIgnorePatterns: [
    '/node_modules/',
    '^.+\\.module\\.(css|sass|scss)$',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testTimeout: 10000,
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
