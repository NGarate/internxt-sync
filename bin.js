#!/usr/bin/env node

/**
 * WebDAV File Sync CLI Wrapper
 * 
 * This provides a simple command-line interface for the WebDAV File Synchronization Tool.
 * Users simply need to install this package globally and run 'webdav-backup'.
 */

// Detect runtime and set global flag for runtime detection elsewhere in the app
// Can be checked with: if (globalThis.isBunRuntime) { ... }
globalThis.isBunRuntime = typeof process !== 'undefined' && 
  typeof process.versions !== 'undefined' && 
  typeof process.versions.bun !== 'undefined';

// Pre-load external dependencies to ensure they're available
import chalk from 'chalk';
import * as webdav from 'webdav';

// Make dependencies available globally to avoid issues during module resolution
globalThis.chalkImport = chalk;
globalThis.webdavImport = webdav;

// Import and run the main application module
import './dist/file-sync.js'; 