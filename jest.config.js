/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest/presets/js-with-ts',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/jest.setup.ts'],
  modulePathIgnorePatterns: [
    '<rootDir>/build/',
    '<rootDir>/coverage_report/',
    '<rootDir>/dist/',
  ],
  collectCoverageFrom: ['src/**'],
};
