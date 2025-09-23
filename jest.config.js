/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest/presets/js-with-ts',
  testEnvironment: 'jsdom',
  modulePathIgnorePatterns: [
    '<rootDir>/build/',
    '<rootDir>/coverage_report/',
    '<rootDir>/dist/',
  ],
  collectCoverageFrom: ['src/**'],
};
