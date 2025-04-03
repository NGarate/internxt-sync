#!/usr/bin/env node

/**
 * Internxt Sync CLI Wrapper
 * 
 * This provides a simple command-line interface for the Internxt WebDAV Uploader.
 * Users simply need to install this package globally and run 'internxt-sync'.
 */

// Pre-load external dependencies to ensure they're available
import chalk from 'chalk';
import * as webdav from 'webdav';

// Make dependencies available globally to avoid issues during module resolution
globalThis.chalkImport = chalk;
globalThis.webdavImport = webdav;

// Import and run the main application module
import './src/main/internxt-sync.js'; 