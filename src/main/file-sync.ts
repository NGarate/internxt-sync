#!/usr/bin/env bun
/**
 * WebDAV File Synchronization Tool - TypeScript Entry Point
 * 
 * Direct TypeScript version for use with Bun runtime for better performance
 */

import chalk from 'chalk';
import path from 'path';
import { fileURLToPath } from 'url';
import { getOptimalConcurrency, isBunEnvironment } from '../utils/env-utils';
import * as logger from '../utils/logger';
import { parseArguments } from '../utils/input-utils';
import { showHelp } from '../utils/help-text';
import FileScanner from '../core/file-scanner';
import Uploader from '../core/upload/uploader';

// Get the directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if we're running with Bun to ensure best performance
if (!isBunEnvironment()) {
  console.warn(chalk.yellow("Note: For best performance, run this file with Bun instead of Node.js."));
  console.warn(chalk.yellow("If you're using Node.js, consider using the universal entry point (index.js) instead."));
}

/**
 * Main application function
 */
async function main() {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    const options = parseArguments(args);
    
    // Show help if requested or not enough arguments
    if (options.showHelp || !options.sourceDir || !options.webdavUrl) {
      showHelp();
      process.exit(options.showHelp ? 0 : 1);
    }

    // Initialize file scanner with force upload option if specified
    const fileScanner = new FileScanner(options.sourceDir, options.verbosity, options.forceUpload);
    
    // Handle WebDAV URL
    const webdavUrl = options.webdavUrl;
    
    // Check if we have a WebDAV URL
    if (!webdavUrl) {
      logger.error("WebDAV URL is required. Use --webdav-url to specify it.");
      process.exit(1);
    }
    
    // Get optimal concurrency
    const concurrentUploads = getOptimalConcurrency(options.cores);
    
    // Create uploader
    const uploader = new Uploader(
      webdavUrl,
      concurrentUploads,
      options.targetDir,
      options.verbosity
    );
    
    // Link the file scanner to the uploader
    uploader.setFileScanner(fileScanner);
    
    // Scan the source directory
    const scanResult = await fileScanner.scan();
    
    // Start the upload process
    if (scanResult.filesToUpload.length === 0) {
      logger.success("All files are up to date. Nothing to upload.", options.verbosity);
    } else {
      await uploader.startUpload(scanResult.filesToUpload);
    }
  } catch (error) {
    logger.error(`Fatal error: ${error.message}`);
    process.exit(1);
  }
}

// Check if this module is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default main; 