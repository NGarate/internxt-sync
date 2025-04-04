/**
 * Test Module Mapper
 * 
 * This module provides substitutions for external dependencies during tests.
 * It maps import paths to mock implementations to avoid external dependencies.
 */

// Import mock implementations
import chalkMock from './mocks/chalk-mock.ts';
import webdavMock from './mocks/webdav-mock.ts';

// Module mapping configuration for Bun tests
export default {
  // Map imports of external modules to our test implementations
  modules: {
    // Replace chalk with our mock implementation
    "chalk": () => chalkMock,
    
    // Replace webdav with a mock implementation
    "webdav": () => webdavMock,
    
    // Replace the real logger with our test logger
    "../utils/logger": () => require("../src/utils/test-logger")
  }
}; 