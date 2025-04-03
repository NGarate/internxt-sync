# Test Configuration

This directory contains all testing-related configurations and utilities for the Internxt Sync project.

## Directory Structure

- `helpers/`: Contains test helper files
  - `setup.ts`: Main test setup file that configures the Bun test environment
  - `bun-test-fix.ts`: Utilities and fixes for Bun test environment issues
  
- `mocks/`: Contains mock implementations for external dependencies
  - `chalk-mock.ts`: Mock implementation of the chalk library
  - `webdav-mock.ts`: Mock implementation of the webdav library

- `scripts/`: Contains test runner scripts
  - `run-tests.ts`: Script for running different test configurations

- `config/`: Contains test configuration files
  - `.bun.test.js`: Bun test configuration file loaded automatically by Bun
  - `buntest.config.ts`: TypeScript configuration for Bun tests

- `loaders/`: Contains module loaders for tests
  - `bun-test-loader.ts`: Module loader for mocking external dependencies during tests

- `tsconfig.test.json`: TypeScript configuration specific for tests

## Usage

Tests can be run using the npm scripts defined in package.json:

```bash
# Run working tests
bun run test

# Run all tests
bun run test:all

# Run tests that require mocks
bun run test:mocked

# Run specific test files
bun run test:file [test-file-paths]

# Run tests in watch mode
bun run test:watch

# Run specific test files (the ones currently working)
bun run test:src

# Run tests with advanced configuration
bun run test:advanced
```

## Adding New Tests

1. Create a new test file in the `src/test` directory following the naming convention `*.test.ts`
2. Add the test file path to the appropriate list in `src/test/test-helpers/test-only.ts` if needed
3. Run the tests using one of the commands above

## Test Configuration Files

- `.bun.test.js`: This is automatically loaded by Bun when running tests. It provides basic mock implementations for external dependencies.
- `buntest.config.ts`: This file configures Bun's test runner with more advanced options, including module mocking and test globals.
- `bun-test-loader.ts`: This module loader intercepts module imports during tests and provides mock implementations for external dependencies.
- `bun-test-fix.ts`: This helper file provides utilities and fixes for common issues in the Bun test environment. 