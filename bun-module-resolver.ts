/**
 * Custom module resolver for Bun tests
 * 
 * This file helps resolve module imports for compiled JavaScript tests.
 * It maps imports from dist files to the appropriate source files.
 */

export default {
  // Define module resolution rules
  resolve: {
    // Map compiled JS module paths to source TS paths
    '../core/file-scanner.js': './src/core/file-scanner.ts',
    '../core/upload/file-upload-manager.js': './src/core/upload/file-upload-manager.ts',
    '../core/upload/progress-tracker.js': './src/core/upload/progress-tracker.ts',
    '../core/upload/uploader.js': './src/core/upload/uploader.ts',
    '../core/internxt-cli.js': './src/core/internxt-cli.ts',
    
    // External dependencies
    'chalk': './src/test/mocks/chalk-mock.ts',
    'webdav': './src/test/mocks/webdav-mock.ts'
  }
}; 