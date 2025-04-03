import { WebDAVConnectivityOptions, WebDAVServiceOptions, WebDAVClientOptions, UploadResult, DirectoryResult } from '../interfaces/webdav.js';
/**
 * Test Setup for Internxt WebDAV Uploader
 * 
 * This file provides common setup and utility functions for tests.
 */

import { spyOn, beforeEach, afterEach, mock } from 'bun:test';

/**
 * Creates a spy on a method that properly handles async functions
 * 
 * @param {object} obj - The object containing the method to spy on
 * @param {string} method - The name of the method to spy on
 * @returns {function} The spy function
 */
export function createSpy(obj, method) {
  const original = obj[method];
  const spy = spyOn(obj, method);
  
  // Store the original method for restoration
  spy.originalMethod = original;
  
  // Add a restore method
  spy.mockRestore = function() {
    obj[method] = original;
  };
  
  return spy;
}

/**
 * Creates a mock for fs.statSync that returns a file stat object
 * 
 * @param {boolean} isDirectory - Whether the stat should represent a directory
 * @param {number} size - The size of the file in bytes
 * @param {Date} mtime - The modification time
 * @returns {object} A mock stat object
 */
export function createMockStat(isDirectory = false, size = 1024, mtime = new Date()) {
  return {
    isDirectory: () => isDirectory,
    isFile: () => !isDirectory,
    size: size,
    mtime: mtime
  };
}

/**
 * Sets up common mocks for file system operations
 * 
 * @param {object} fs - The fs module
 * @param {object} path - The path module
 * @returns {object} An object containing all the spies
 */
export function setupFsMocks(fs, path) {
  const spies = {
    existsSync: spyOn(fs, 'existsSync').mockImplementation(() => true),
    statSync: spyOn(fs, 'statSync').mockImplementation(() => createMockStat(false)),
    readdirSync: spyOn(fs, 'readdirSync').mockImplementation(() => []),
    resolve: spyOn(path, 'resolve').mockImplementation((dir) => `/resolved${dir}`)
  };
  
  return spies;
}

/**
 * Test setup file that ensures dependencies are properly mocked
 * and test globals are available in all test files
 */

// Import the Bun test config to ensure mocks are registered
import "../../buntest.config";

// Make global mocks available
declare global {
  namespace NodeJS {
    interface Global {
      expect: any;
      mock: any;
      test: any;
      describe: any;
      beforeEach: any;
      afterEach: any;
      afterAll: any;
      beforeAll: any;
      mockModules: {
        chalk: any;
        webdav: any;
      };
    }
  }
}

// Mock fs module for tests
const mockFs = {
  promises: {
    writeFile: async () => true,
    readFile: async () => '{"test": "data"}',
    access: async () => true,
    mkdir: async () => true,
  },
  createReadStream: () => {
    const stream = new EventTarget();
    // Add common stream methods that tests might use
    (stream as any).on = (event: string, callback: any) => {
      stream.addEventListener(event, callback);
      return stream;
    };
    (stream as any).pipe = () => stream;
    
    // Simulate data event after a small delay
    setTimeout(() => {
      stream.dispatchEvent(new Event('data'));
      stream.dispatchEvent(new Event('end'));
    }, 10);
    
    return stream;
  },
  existsSync: () => true,
  mkdirSync: () => true,
  readdirSync: () => [],
  statSync: () => ({ isDirectory: () => false }),
  unlinkSync: () => true,
};

// Mock global modules
globalThis.jest = {
  fn: (implementation?: any) => implementation || (() => {}),
  spyOn: (obj: any, method: string) => {
    const original = obj[method];
    const mock = () => {};
    mock.mockImplementation = (impl: any) => {
      obj[method] = impl;
      return mock;
    };
    mock.mockRestore = () => {
      obj[method] = original;
      return mock;
    };
    return mock;
  }
};

// Register additional mock modules
globalThis.mockModules.fs = mockFs;

// Mock any other modules needed for tests
globalThis.mockModules['child_process'] = {
  spawn: () => ({
    on: () => {},
    stdout: { on: () => {} },
    stderr: { on: () => {} },
  }),
  execSync: () => Buffer.from('mock output'),
};

// Export for explicit imports in test files if needed
export const mockExports = {
  fs: mockFs,
  chalk: globalThis.mockModules.chalk,
  webdav: globalThis.mockModules.webdav,
};

/**
 * Global test setup file
 * This file is loaded before running tests to set up the test environment
 */

// Mock modules that are commonly used in tests
const setupMocks = () => {
  // Create mock implementation for chalk
  const chalkMock = {
    blue: (text: string) => `\x1b[34m${text}\x1b[0m`,
    green: (text: string) => `\x1b[32m${text}\x1b[0m`,
    yellow: (text: string) => `\x1b[33m${text}\x1b[0m`,
    red: (text: string) => `\x1b[31m${text}\x1b[0m`,
    gray: (text: string) => `\x1b[90m${text}\x1b[0m`,
    bold: (text: string) => `\x1b[1m${text}\x1b[0m`,
    dim: (text: string) => `\x1b[2m${text}\x1b[0m`,
    italic: (text: string) => `\x1b[3m${text}\x1b[0m`,
    underline: (text: string) => `\x1b[4m${text}\x1b[0m`,
  };

  // Add method chaining for chalk
  Object.keys(chalkMock).forEach(color => {
    if (typeof chalkMock[color] === 'function') {
      const colorFn = chalkMock[color];
      chalkMock[color] = Object.assign(colorFn, {
        bold: (text: string) => `\x1b[1m${colorFn(text)}\x1b[0m`,
        underline: (text: string) => `\x1b[4m${colorFn(text)}\x1b[0m`,
        italic: (text: string) => `\x1b[3m${colorFn(text)}\x1b[0m`,
        dim: (text: string) => `\x1b[2m${colorFn(text)}\x1b[0m`,
      });
    }
  });

  // Create mock implementation for webdav
  const webdavMock = {
    createClient: () => ({
      putFileContents: async () => true,
      getDirectoryContents: async () => [],
      exists: async () => false,
      createDirectory: async () => true,
    }),
  };

  // Manually register mocks globally
  // This helps with tests in the dist directory and with both ESM and CJS module systems
  globalThis.mockModules = {
    chalk: chalkMock,
    webdav: webdavMock
  };

  // Global Jest compatibility layer
  globalThis.jest = {
    fn: mock,
    mock: () => {},
    resetAllMocks: () => {},
    spyOn: (obj: any, method: string) => {
      const original = obj[method];
      const mockFn = mock((...args: any[]) => original.apply(obj, args));
      obj[method] = mockFn;
      return mockFn;
    }
  };
};

// Initialize mocks before tests run
setupMocks();

// Reset any test state before each test
beforeEach(() => {
  // Any setup that should run before each test
});

// Mock the imports for chalk and webdav modules
// This allows test files to import these modules without errors
globalThis.process = globalThis.process || {};
globalThis.process.env = globalThis.process.env || {};
globalThis.process.env.NODE_ENV = 'test';

// Add explicit mocks for modules
if (typeof require !== 'undefined') {
  // Define require.cache if it doesn't exist
  require.cache = require.cache || {};
  
  // Mock chalk module
  require.cache['chalk'] = {
    id: 'chalk',
    filename: 'chalk',
    loaded: true,
    exports: globalThis.mockModules.chalk
  };

  // Mock webdav module
  require.cache['webdav'] = {
    id: 'webdav',
    filename: 'webdav',
    loaded: true,
    exports: globalThis.mockModules.webdav
  };
} 