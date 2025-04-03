/**
 * Test Module Mapper
 * 
 * This module provides substitutions for external dependencies during tests.
 * It maps import paths to mock implementations to avoid external dependencies.
 */

// Module mapping configuration for Bun tests
export default {
  // Map imports of external modules to our test implementations
  modules: {
    // Replace chalk with a simple ANSI color implementation
    "chalk": () => ({
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
    }),
    
    // Replace webdav with a mock implementation
    "webdav": () => ({
      createClient: () => ({
        putFileContents: async () => true,
        getDirectoryContents: async () => [],
        exists: async () => false,
        createDirectory: async () => true,
      }),
    }),
    
    // Replace the real logger with our test logger
    "../utils/logger": () => require("../utils/test-logger")
  }
}; 