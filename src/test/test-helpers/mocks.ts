/**
 * Test mocks for external dependencies
 */

// Mock implementation for chalk
export const chalkMock = {
  // Style methods
  bold: (text: string) => text,
  dim: (text: string) => text,
  italic: (text: string) => text,
  underline: (text: string) => text,
  inverse: (text: string) => text,
  hidden: (text: string) => text,
  strikethrough: (text: string) => text,
  
  // Color methods
  black: (text: string) => text,
  red: (text: string) => text,
  green: (text: string) => text,
  yellow: (text: string) => text,
  blue: (text: string) => text,
  magenta: (text: string) => text,
  cyan: (text: string) => text,
  white: (text: string) => text,
  gray: (text: string) => text,
  grey: (text: string) => text,
  
  // Background methods
  bgBlack: (text: string) => text,
  bgRed: (text: string) => text,
  bgGreen: (text: string) => text,
  bgYellow: (text: string) => text,
  bgBlue: (text: string) => text,
  bgMagenta: (text: string) => text,
  bgCyan: (text: string) => text,
  bgWhite: (text: string) => text,
  
  // Modifiers - each returns an object with color methods
  visible: {
    black: (text: string) => text,
    red: (text: string) => text,
    green: (text: string) => text,
    yellow: (text: string) => text,
    blue: (text: string) => text,
    magenta: (text: string) => text,
    cyan: (text: string) => text,
    white: (text: string) => text,
  }
};

// Add method chaining to chalk
Object.keys(chalkMock).forEach(method => {
  if (typeof chalkMock[method] === 'function') {
    const fn = chalkMock[method];
    // Add commonly chained methods
    ['bold', 'underline', 'italic', 'dim'].forEach(style => {
      if (chalkMock[style]) {
        fn[style] = (text) => chalkMock[style](fn(text));
      }
    });
  }
});

// Mock WebDAV client and factory
export const webdavClientMock = {
  createDirectory: () => Promise.resolve(),
  getDirectoryContents: () => Promise.resolve([]),
  putFileContents: () => Promise.resolve(),
  exists: () => Promise.resolve(false),
  stat: () => Promise.resolve({}),
  customRequest: () => Promise.resolve({}),
};

export const webdavMock = {
  createClient: () => webdavClientMock,
};

// Make these available globally if needed
globalThis.chalkMock = chalkMock;
globalThis.webdavMock = webdavMock; 