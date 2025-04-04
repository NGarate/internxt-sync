#!/usr/bin/env bun

/**
 * WebDAV File Sync CLI Wrapper (Bun version)
 * 
 * This provides a Bun-specific command-line interface for the WebDAV File Synchronization Tool.
 */

// Pre-load external dependencies to ensure they're available
import chalk from 'chalk';
import * as webdav from 'webdav';

// Make dependencies available globally to avoid issues during module resolution
globalThis.chalkImport = chalk;
globalThis.webdavImport = webdav;
globalThis.isBunRuntime = true;

// Import and run the Bun-optimized build of the main application module
import './dist/bun/file-sync.js'; 