#!/usr/bin/env node

/**
 * WebDAV File Sync CLI Wrapper
 * 
 * This provides a simple command-line interface for the WebDAV File Synchronization Tool.
 * Users simply need to install this package globally and run 'webdav-sync'.
 */

// Pre-load external dependencies to ensure they're available
import chalk from 'chalk';
import * as webdav from 'webdav';

// Make dependencies available globally to avoid issues during module resolution
globalThis.chalkImport = chalk;
globalThis.webdavImport = webdav;

// Import and run the main application module
import './dist/file-sync.js'; 