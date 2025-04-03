#!/usr/bin/env bun
/**
 * Internxt WebDAV Uploader - TypeScript Entry Point
 * 
 * Direct TypeScript version for use with Bun runtime for better performance
 */

import chalk from 'chalk';
import path from 'path';
import { fileURLToPath } from 'url';
import { getOptimalConcurrency, isBunEnvironment } from './src/utils/env-utils.js';
import * as logger from './src/utils/logger.js';
import { parseArguments } from './src/utils/input-utils.js';
import { showHelp } from './src/utils/help-text.js';
import InternxtCLI from './src/core/internxt-cli.js';
import FileScanner from './src/core/file-scanner.js';
import Uploader from './src/core/uploader.js';

// Get the directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if we're running with Bun to ensure best performance
if (!isBunEnvironment()) {
  console.log(chalk.yellow("Note: For best performance, run this file with Bun instead of Node.js."));
  console.log(chalk.yellow("If you're using Node.js, consider using the universal entry point (index.js) instead."));
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
    if (options.showHelp || !options.sourceDir) {
      showHelp();
      process.exit(options.showHelp ? 0 : 1);
    }

    // Initialize internxt CLI with proper verbosity level
    const internxtCLI = new InternxtCLI(options.verbosity);
    
    // Initialize file scanner
    const fileScanner = new FileScanner(options.sourceDir, options.verbosity);
    
    // Handle WebDAV URL
    let webdavUrl = options.webdavUrl;
    
    // Setup Internxt if not skipped
    if (!options.skipSetup) {
      logger.info("Setting up Internxt...", options.verbosity);
      if (!await internxtCLI.setup()) {
        logger.error("Setup failed. Cannot continue.");
        process.exit(1);
      }
      webdavUrl = webdavUrl || await internxtCLI.getWebDAVUrl();
    } else {
      // Skip-setup mode
      if (webdavUrl) {
        // If WebDAV URL is explicitly provided, use it
        internxtCLI.setWebDAVUrl(webdavUrl);
        logger.info(`Using provided WebDAV URL: ${webdavUrl}`, options.verbosity);
      } else {
        // Try to get WebDAV URL from Internxt CLI without full setup
        logger.info("Checking for WebDAV URL...", options.verbosity);
        webdavUrl = await internxtCLI.getWebDAVUrl(true);
        
        if (!webdavUrl) {
          logger.error("Could not detect WebDAV URL. Please enable WebDAV or provide --webdav-url");
          process.exit(1);
        }
        
        logger.info(`Using detected WebDAV URL: ${webdavUrl}`, options.verbosity);
      }
    }
    
    // Check if we have a WebDAV URL
    if (!webdavUrl) {
      logger.error("WebDAV URL is not available. Cannot continue.");
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
    console.error(error);
    process.exit(1);
  }
}

// Check if this module is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    logger.error(`Fatal error: ${error.message}`);
    console.error(error);
    process.exit(1);
  });
}

export default main;