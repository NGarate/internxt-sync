/**
 * Test helper utilities
 * This file contains utilities to help with testing
 */

/**
 * This file exports lists of test files in different categories
 * to help with running specific subsets of tests.
 */

/**
 * List of test files that are known to work correctly
 */
export const WORKING_TEST_FILES = [
  './src/test/fs-utils.test.ts',
  './src/test/webdav-directory-service.test.ts',
  './src/test/file-scanner.test.ts',
  './src/test/command-runner.test.ts',
  './src/test/env-utils.test.ts',
  './src/test/file-upload-manager.test.ts',
  './src/test/hash-cache.test.ts',
  './src/test/help-text.test.ts',
  './src/test/input-utils.test.ts',
  './src/test/webdav-connectivity-service.test.ts',
  './src/test/webdav-file-service.test.ts'
];

/**
 * List of test files that have issues with chalk or webdav modules
 */
export const FAILING_TEST_FILES = [
  './src/test/logger.test.ts',
  './src/test/uploader.test.ts',
  './src/test/progress-tracker.test.ts',
  './src/test/internxt-cli.test.ts',
  './src/test/webdav-client-factory.test.ts',
  './src/test/webdav-service.test.ts',
  './src/test/webdav-service-composed.test.ts'
];

/**
 * List of test files that require module mocking to work
 */
export const REQUIRES_MOCKS = [
  './src/test/logger.test.ts',
  './src/test/uploader.test.ts',
  './src/test/progress-tracker.test.ts',
  './src/test/internxt-cli.test.ts',
  './src/test/webdav-client-factory.test.ts',
  './src/test/webdav-service.test.ts',
  './src/test/webdav-service-composed.test.ts'
];

/**
 * Specialized tests that require specific setup
 */
export const SPECIALIZED_TESTS = [
  './src/test/integration.test.ts'
];

/**
 * Get the Bun test command for working tests
 */
export const getWorkingTestsCommand = () => {
  return `bun test --tsconfig-override tsconfig.test.json ${WORKING_TEST_FILES.join(' ')}`;
};

/**
 * Get the Bun test command with coverage for working tests
 */
export const getTestCoverageCommand = () => {
  return `bun test --coverage --tsconfig-override tsconfig.test.json ${WORKING_TEST_FILES.join(' ')}`;
}; 