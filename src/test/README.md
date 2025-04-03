# Testing the Internxt Sync Tool

This directory contains the test files for the Internxt Sync tool. The test configuration and setup files have been moved to the `/test-config` directory at the project root.

## Running Tests

To run the tests that have been fixed and are working with Bun's testing framework, use:

```bash
bun run test:src
```

This will run only the specific tests that have been updated to work correctly with Bun.

## Test Configurations

All test configurations have been moved to the `/test-config` directory:

- **test-config/tsconfig.test.json**: TypeScript configuration specific for testing
- **test-config/helpers/setup.ts**: Setup code for the tests, including mock configuration
- **test-config/config/.bun.test.js**: Bun test configuration
- **test-config/loaders/bun-test-loader.ts**: Module loader for tests

See the `test-config/README.md` file for more details.

## Fixed Tests

The following tests have been fixed and are working correctly:

- `logger.test.ts`: Tests the logger utilities
- `progress-tracker.test.ts`: Tests the progress tracker functionality
- `uploader.test.ts`: Tests the file uploader functionality 

## Known Issues

When running `bun test` directly, you may encounter failures because it picks up both the TypeScript source files in `src/` and the compiled JavaScript files in `dist/`. 

To avoid this, always use the provided test scripts (`test:src`, etc.) to run tests with the correct configuration.

## Test Helper Files

The test helper files that were in the `test-helpers` directory have been moved to the `/test-config/helpers` and `/test-config/mocks` directories. 