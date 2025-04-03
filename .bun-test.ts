/**
 * Bun test configuration file
 * This file will be automatically loaded when running tests with Bun
 */

// Configure module mocks for the test environment
export default {
  // Preload the test setup file
  preload: ["./src/test/test-setup.ts"],
  
  // Configure module mocks
  mocks: {
    // Mock chalk module
    "chalk": () => {
      return {
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
    },
    
    // Mock webdav module
    "webdav": () => {
      return {
        createClient: () => ({
          putFileContents: async () => true,
          getDirectoryContents: async () => [],
          exists: async () => false,
          createDirectory: async () => true,
        }),
      };
    }
  }
} 