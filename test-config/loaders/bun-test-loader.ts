/**
 * Bun Test Module Loader
 * 
 * This file provides module replacement functionality for tests.
 * It intercepts imports of external dependencies and provides mock implementations.
 */

// Define the mock for chalk
const chalkMock = {
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  gray: (text) => `\x1b[90m${text}\x1b[0m`,
  bold: (text) => `\x1b[1m${text}\x1b[0m`,
  dim: (text) => `\x1b[2m${text}\x1b[0m`,
  italic: (text) => `\x1b[3m${text}\x1b[0m`,
  underline: (text) => `\x1b[4m${text}\x1b[0m`,
};

// Add method chaining for chalk
Object.keys(chalkMock).forEach(color => {
  if (typeof chalkMock[color] === 'function') {
    const colorFn = chalkMock[color];
    chalkMock[color] = Object.assign(colorFn, {
      bold: (text) => `\x1b[1m${colorFn(text)}\x1b[0m`,
      underline: (text) => `\x1b[4m${colorFn(text)}\x1b[0m`,
      italic: (text) => `\x1b[3m${colorFn(text)}\x1b[0m`,
      dim: (text) => `\x1b[2m${colorFn(text)}\x1b[0m`,
    });
  }
});

// Define the mock for webdav
const webdavMock = {
  createClient: () => ({
    putFileContents: async () => true,
    getDirectoryContents: async () => [],
    exists: async () => false,
    createDirectory: async () => true,
  }),
};

// Export the loader configuration
export default {
  // Handle module resolution
  resolve: {
    // Mock modules
    "chalk": "./src/test/mocks/chalk-mock.ts",
    "webdav": "./src/test/mocks/webdav-mock.ts"
  }
}; 