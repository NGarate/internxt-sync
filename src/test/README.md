# Testing the Internxt Sync Tool

This directory contains tests for the Internxt Sync tool. 

## Running Tests

To run the tests that have been fixed and are working with Bun's testing framework, use:

```bash
bun run test:src
```

This will run only the specific tests that have been updated to work correctly with Bun.

## Test Configurations

- **tsconfig.test.json**: Contains TypeScript configuration specific for testing
- **setup.ts**: Contains setup code for the tests, including mock configuration

## Fixed Tests

The following tests have been fixed and are working correctly:

- `logger.test.ts`: Tests the logger utilities
- `progress-tracker.test.ts`: Tests the progress tracker functionality
- `uploader.test.ts`: Tests the file uploader functionality 

## Known Issues

When running `bun test` directly, you may encounter failures because it picks up both the TypeScript source files in `src/` and the compiled JavaScript files in `dist/`. 

To avoid this, always use the provided test scripts (`test:src`, etc.) to run tests with the correct configuration.

## Test Helper Files

The `test-helpers` directory contains various utilities to support testing, including mocks and the test setup file. 