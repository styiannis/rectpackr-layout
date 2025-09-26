/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest/presets/js-with-ts',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/mocks/index.ts'],
  modulePathIgnorePatterns: [
    '<rootDir>/build/',
    '<rootDir>/code_documentation/',
    '<rootDir>/coverage_report/',
    '<rootDir>/dist/',
  ],
  collectCoverageFrom: ['src/**'],
};
