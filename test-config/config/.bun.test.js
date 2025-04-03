// .bun.test.js - Bun test configuration file
// This file is automatically loaded by Bun when running tests

/**
 * Mock implementation for chalk
 */
const mockChalk = {
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  gray: (text) => `\x1b[90m${text}\x1b[0m`,
  default: {
    blue: (text) => `\x1b[34m${text}\x1b[0m`,
    green: (text) => `\x1b[32m${text}\x1b[0m`,
    yellow: (text) => `\x1b[33m${text}\x1b[0m`,
    red: (text) => `\x1b[31m${text}\x1b[0m`,
    gray: (text) => `\x1b[90m${text}\x1b[0m`,
  }
};

/**
 * Mock implementation for webdav
 */
const mockWebdav = {
  createClient: () => ({
    putFileContents: async () => true,
    getDirectoryContents: async () => [],
    exists: async () => false,
    createDirectory: async () => true,
  }),
};

// Define the mocks we want to use in our tests
module.exports = {
  mocks: {
    chalk: mockChalk,
    webdav: mockWebdav,
  }
}; 