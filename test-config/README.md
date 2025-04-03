# Test Configuration

This directory contains all testing-related configurations and utilities for the Internxt Sync project.

## Directory Structure

- `helpers/`: Contains test helper files
  - `setup.ts`: Main test setup file that configures the Bun test environment
  
- `mocks/`: Contains mock implementations for external dependencies
  - `chalk-mock.ts`: Mock implementation of the chalk library
  - `webdav-mock.ts`: Mock implementation of the webdav library

- `tsconfig.test.json`: TypeScript configuration specific for tests

## Usage

Tests are run using Bun's built-in test runner:

```bash
# Run all tests
bun run test
```

The test runner is configured in `bunfig.toml` to:
- Automatically find and run all `*.test.ts` files
- Use the setup file in `helpers/setup.ts`
- Use the TypeScript configuration in `tsconfig.test.json`
- Mock external dependencies like chalk and webdav directly via the `[test.mocks]` configuration

## Adding New Tests

1. Create a new test file in the `src/test` directory following the naming convention `*.test.ts`
2. Write your tests using Bun's test API (similar to Jest)
3. Run the tests using `bun run test`

## Configuration Files

- `helpers/setup.ts`: Sets up the test environment, including mocks and global test functions
- `tsconfig.test.json`: TypeScript configuration specific for tests
- `mocks/*.ts`: Mock implementations of external dependencies

## Mocking

Mocks for external dependencies are configured directly in `bunfig.toml`:

```toml
[test.mocks]
"chalk" = "./test-config/mocks/chalk-mock.ts"
"webdav" = "./test-config/mocks/webdav-mock.ts"
```

This tells Bun to use these mock implementations whenever the specified modules are imported during tests. 