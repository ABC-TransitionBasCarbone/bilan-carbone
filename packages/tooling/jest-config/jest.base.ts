import type { Config } from 'jest'

export const nextJestBaseConfig: Config = {
  preset: 'ts-jest',
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  testMatch: ['<rootDir>/src/tests/unit/**/*.test.ts', '<rootDir>/src/**/*.test.*'],
  setupFilesAfterEnv: ['<rootDir>/src/tests/unit/setupTests.ts'],
  // Add more setup options before each test is run
  moduleNameMapper: {
    '^@abc-transitionbascarbone/publicodes-(.*)$':
    '<rootDir>/../../packages/publicodes-packages/publicodes-$1/',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
}
