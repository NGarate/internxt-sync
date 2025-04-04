# Test Configuration

This directory contains configuration files and utilities for testing the WebDAV Backup Tool.

## Structure

- `bun-test-loader.ts` - Configuration for Bun test loader to handle imports and module loading
- `module-mapper.ts` - Maps external dependencies to mock implementations for testing
- `setup.ts` - Setup file for test environment
- `test-utils.ts` - Utility functions for test helpers, mocks, and spies
- `tsconfig.test.json` - TypeScript configuration for tests
- `integration.test.ts` - Documentation for integration tests (not implemented)

### Mocks Directory

The `mocks` directory contains mock implementations for external dependencies:

- `chalk-mock.ts` - Mock implementation for chalk (terminal colors)
- `event-emitter-mock.ts` - Mock implementation for EventEmitter
- `function-mock.ts` - Mock implementations for function utilities
- `promise-mock.ts` - Mock implementations for Promise utilities
- `webdav-mock.ts` - Mock implementation for WebDAV client

## Usage

### Running Tests

Tests are run using the Bun test runner. Test files should be co-located with their implementation files.

```bash
# Run all tests
bun test

# Run tests in a specific file
bun test src/core/webdav/webdav-service.test.ts

# Run tests in watch mode
bun test --watch
```

### Adding New Tests

When adding new tests:

1. Create a test file next to the implementation file with a `.test.ts` extension
2. Import test utilities from `test-config/test-utils`
3. Use the mock implementations from `test-config/mocks/*` as needed

### Example Test

```typescript
import { expect, describe, it, beforeEach } from 'bun:test';
import { spyOn, createMockFs } from '../../test-config/test-utils';
import * as logger from '../../utils/logger';
import { MyClass } from './my-class';

describe('MyClass', () => {
  let myClass;
  let mockFs;
  let verboseSpy;

  beforeEach(() => {
    mockFs = createMockFs();
    verboseSpy = spyOn(logger, 'verbose');
    myClass = new MyClass(mockFs);
  });

  it('should do something', () => {
    const result = myClass.doSomething();
    expect(result).toBe(true);
    expect(verboseSpy).toHaveBeenCalled();
  });
});
``` 