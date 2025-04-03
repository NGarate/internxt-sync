#!/usr/bin/env node

/**
 * Simple wrapper for Internxt WebDAV Uploader
 * This ensures compatibility when running from different environments
 */

// External dependencies should be loaded first
import chalk from 'chalk';
import * as webdav from 'webdav';

// Set these in global scope to ensure they're available
globalThis.chalkImport = chalk;
globalThis.webdavImport = webdav;

// Import the actual module
import './internxt-sync.js'; 