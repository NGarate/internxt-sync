import { WebDAVConnectivityOptions, WebDAVServiceOptions, WebDAVClientOptions, UploadResult, DirectoryResult } from '../interfaces/webdav.js';
/**
 * Test Helpers for Bun Tests
 * 
 * This file provides utility functions to help with mocking and testing
 * for the Internxt WebDAV Uploader project.
 */

/**
 * Creates a mock promise result for tests. Use this instead of directly using 
 * Promise.resolve() in test mocks, as there appear to be issues with that in Bun tests.
 * 
 * @param {any} value - The value to resolve the promise with
 * @returns {Promise<any>} A promise that resolves with the given value
 */
export function mockPromiseResult(value) {
  return new Promise(resolve => resolve(value));
}

/**
 * Creates a mock promise rejection for tests. Use this instead of directly using
 * Promise.reject() in test mocks.
 * 
 * @param {Error} error - The error to reject the promise with
 * @returns {Promise<never>} A promise that rejects with the given error
 */
export function mockPromiseRejection(error) {
  return new Promise((_, reject) => reject(error));
}

/**
 * Creates a mock object with all the properties/methods of an EventEmitter
 * 
 * @returns {object} A mock event emitter
 */
export function createMockEventEmitter() {
  const emitter = {
    _events: {},
    _eventsCount: 0,
    _maxListeners: undefined,
    on: () => emitter,
    once: () => emitter,
    emit: () => true,
    addListener: () => emitter,
    removeListener: () => emitter,
    setMaxListeners: () => emitter,
    getMaxListeners: () => 10,
    listeners: () => [],
    rawListeners: () => [],
    listenerCount: () => 0,
    eventNames: () => [],
    prependListener: () => emitter,
    prependOnceListener: () => emitter,
    off: () => emitter,
    removeAllListeners: () => emitter
  };
  
  // Add Symbol.for('nodejs.util.inspect.custom') to avoid serialization issues
  emitter[Symbol.for('nodejs.util.inspect.custom')] = () => 'MockEventEmitter';
  
  return emitter;
}

/**
 * Creates a more complex mock process for testing
 * 
 * @returns {object} A mock child process
 */
export function createMockProcess() {
  const stdin = createMockEventEmitter();
  stdin.write = () => true;
  stdin.end = () => {};
  
  const stdout = createMockEventEmitter();
  const stderr = createMockEventEmitter();
  
  const proc = createMockEventEmitter();
  proc.stdin = stdin;
  proc.stdout = stdout;
  proc.stderr = stderr;
  proc.kill = () => true;
  proc.pid = 12345;
  
  return proc;
}

/**
 * Bun Test Fixes
 * 
 * This file provides mock implementations for external dependencies
 * that are needed by tests but may not be properly loaded in the test environment.
 */

import { expect, mock, test, describe, beforeEach, afterEach, afterAll, beforeAll } from "bun:test";

// Make test globals available
(globalThis as any).expect = expect;
(globalThis as any).mock = mock;
(globalThis as any).test = test;
(globalThis as any).describe = describe;
(globalThis as any).beforeEach = beforeEach;
(globalThis as any).afterEach = afterEach;
(globalThis as any).afterAll = afterAll;
(globalThis as any).beforeAll = beforeAll;

// Create a mock for chalk
export const mockChalk = {
  blue: (text: string) => `\x1b[34m${text}\x1b[0m`,
  green: (text: string) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text: string) => `\x1b[33m${text}\x1b[0m`,
  red: (text: string) => `\x1b[31m${text}\x1b[0m`,
  gray: (text: string) => `\x1b[90m${text}\x1b[0m`,
  default: {
    blue: (text: string) => `\x1b[34m${text}\x1b[0m`,
    green: (text: string) => `\x1b[32m${text}\x1b[0m`,
    yellow: (text: string) => `\x1b[33m${text}\x1b[0m`,
    red: (text: string) => `\x1b[31m${text}\x1b[0m`,
    gray: (text: string) => `\x1b[90m${text}\x1b[0m`,
  }
};

// Create a mock for webdav
export const mockWebdav = {
  createClient: () => ({
    putFileContents: async () => true,
    getDirectoryContents: async () => [],
    exists: async () => false,
    createDirectory: async () => true,
  }),
};

// Provide jest-like functionality for tests
export const jest = {
  fn: (implementation?: any) => implementation || (() => {}),
  spyOn: (obj: any, method: string) => {
    const original = obj[method];
    const mock = jest.fn();
    obj[method] = mock;
    mock.mockRestore = () => {
      obj[method] = original;
    };
    return mock;
  }
};

// Register mocks globally for modules to access
(globalThis as any).jest = jest;
(globalThis as any).mockChalk = mockChalk;
(globalThis as any).mockWebdav = mockWebdav;

// Intercept imports for chalk and webdav
// This is a way to mock modules in Bun tests
try {
  // @ts-ignore - Mock implementations for modules
  import.meta.require = (id: string) => {
    if (id === 'chalk') return mockChalk;
    if (id === 'webdav') return mockWebdav;
    throw new Error(`Module ${id} not mocked`);
  };
} catch (e) {
  // Silently fail if import.meta.require can't be modified
}

// Export everything for explicit imports
export {
  expect,
  mock,
  test,
  describe,
  beforeEach,
  afterEach,
  afterAll,
  beforeAll,
}; 