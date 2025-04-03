/**
 * Setup for Bun tests
 */

import { afterAll, beforeAll, beforeEach, afterEach, describe, expect, mock, spyOn, test } from 'bun:test';

// Set test environment
process.env.NODE_ENV = 'test';

// Register mock implementations
// Inlined from the previous register-mocks.ts file
// Mock for chalk
const mockChalk = {
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  default: {
    blue: (text) => `\x1b[34m${text}\x1b[0m`,
    green: (text) => `\x1b[32m${text}\x1b[0m`,
    yellow: (text) => `\x1b[33m${text}\x1b[0m`,
    red: (text) => `\x1b[31m${text}\x1b[0m`
  }
};

// Mock for webdav
const mockWebdav = {
  createClient: () => ({
    putFileContents: async () => true,
    getDirectoryContents: async () => [],
    exists: async () => false,
    createDirectory: async () => true,
  }),
};

// Register mocks globally
globalThis.mockChalk = mockChalk;
globalThis.mockWebdav = mockWebdav;

// Original console methods for restoration
const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  info: console.info
};

// Create mock functions
let mockConsoleLog;
let mockConsoleError;
let mockConsoleWarn;
let mockConsoleInfo;

// Function to reset mocks by creating new ones
function resetConsoleMocks() {
  mockConsoleLog = mock(() => {});
  mockConsoleError = mock(() => {});
  mockConsoleWarn = mock(() => {});
  mockConsoleInfo = mock(() => {});
  
  console.log = mockConsoleLog;
  console.error = mockConsoleError;
  console.warn = mockConsoleWarn;
  console.info = mockConsoleInfo;
}

// Make Jest-compatible functions available globally
globalThis.jest = {
  fn: (implementation) => {
    // Create a mock function with Bun's mock system
    const fn = implementation || (() => {});
    return mock(fn);
  },
  spyOn: (object, method) => {
    const original = object[method];
    const mockFn = mock(() => {});
    
    object[method] = mockFn;
    
    // Add additional properties for compatibility
    mockFn.mockRestore = () => {
      object[method] = original;
    };
    
    mockFn.mockReset = () => {
      // Create a new mock and replace
      const newMock = mock(() => {});
      object[method] = newMock;
      return newMock;
    };
    
    mockFn.mockClear = () => {
      // Create a new mock and replace
      const newMock = mock(() => {});
      object[method] = newMock;
      return newMock;
    };
    
    // Add a 'called' property
    Object.defineProperty(mockFn, 'called', {
      get: () => mockFn.mock.calls.length > 0
    });
    
    return mockFn;
  },
  clearAllMocks: () => {
    // Reset all mocks by creating new ones
    resetConsoleMocks();
  }
};

// Setup before tests
beforeAll(() => {
  // Suppress console output for tests by default
  if (process.env.SUPPRESS_CONSOLE_OUTPUT !== 'false') {
    resetConsoleMocks();
  }
});

// Reset mocks before each test
beforeEach(() => {
  resetConsoleMocks();
});

// Cleanup after all tests
afterAll(() => {
  // Restore original console methods
  console.log = originalConsole.log;
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
  console.info = originalConsole.info;
});

// Make test globals available
globalThis.describe = describe;
globalThis.test = test;
globalThis.expect = expect;
globalThis.beforeAll = beforeAll;
globalThis.afterAll = afterAll;
globalThis.beforeEach = beforeEach;
globalThis.afterEach = afterEach; 