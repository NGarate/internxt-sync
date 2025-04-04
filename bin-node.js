#!/usr/bin/env node

/**
 * WebDAV File Sync CLI Wrapper (Node.js version)
 * 
 * This provides a Node.js-specific command-line interface for the WebDAV File Synchronization Tool.
 */

// Pre-load external dependencies to ensure they're available
import chalk from 'chalk';
import * as webdav from 'webdav';

// Make dependencies available globally to avoid issues during module resolution
globalThis.chalkImport = chalk;
globalThis.webdavImport = webdav;
globalThis.isBunRuntime = false;

// Import and run the Node-optimized build of the main application module
import './dist/node/file-sync.js'; 