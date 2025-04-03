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

// Mock external dependencies
const mockChalk = {
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

// Mock webdav with basic functionality needed for tests
const mockWebdav = {
  createClient: () => ({
    putFileContents: async () => true,
    getDirectoryContents: async () => [],
    exists: async () => false,
    createDirectory: async () => true,
  }),
};

// Register mock modules that tests will import
(globalThis as any).mockModules = {
  chalk: mockChalk,
  webdav: mockWebdav,
};

// Bun uses this module map to replace imports in test files
// This handles both "chalk" and "webdav" imports across all test files
export default {
  module: {
    loaders: [
      {
        loader: "mock",
        options: {
          modules: {
            chalk: () => (globalThis as any).mockModules.chalk,
            webdav: () => (globalThis as any).mockModules.webdav,
          },
        },
      },
    ],
  },
}; 