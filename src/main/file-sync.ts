/**
 * WebDAV File Synchronization Tool - TypeScript Entry Point
 * 
 * Optimized for Bun's runtime for maximum performance
 */

import chalk from 'chalk';
import { getOptimalConcurrency } from '../utils/env-utils';
import * as logger from '../utils/logger';
import FileScanner from '../core/file-scanner';
import Uploader from '../core/upload/uploader';

// Define options interface for better type checking
export interface SyncOptions {
  cores?: number;
  target?: string;
  quiet?: boolean;
  verbose?: boolean;
  force?: boolean;
  webdavUrl: string;
}

/**
 * Main synchronization function that can be called from CLI or programmatically
 */
export async function syncFiles(sourceDir: string, options: SyncOptions): Promise<void> {
  try {
    // Check if we have a WebDAV URL
    if (!options.webdavUrl) {
      throw new Error("WebDAV URL is required");
    }

    // Determine verbosity level
    const verbosity = options.quiet ? 'quiet' : options.verbose ? 'verbose' : 'normal';

    // Initialize file scanner with force upload option if specified
    const fileScanner = new FileScanner(sourceDir, verbosity, options.force);
    
    // Get optimal concurrency
    const concurrentUploads = getOptimalConcurrency(options.cores);
    
    // Create uploader
    const uploader = new Uploader(
      options.webdavUrl,
      concurrentUploads,
      options.target || '/',
      verbosity
    );
    
    // Link the file scanner to the uploader
    uploader.setFileScanner(fileScanner);
    
    // Scan the source directory
    const scanResult = await fileScanner.scan();
    
    // Start the upload process
    if (scanResult.filesToUpload.length === 0) {
      logger.success("All files are up to date. Nothing to upload.", verbosity);
    } else {
      await uploader.startUpload(scanResult.filesToUpload);
    }
  } catch (error) {
    logger.error(`Error during file sync: ${error.message}`);
    throw error; // Let the CLI handle the error
  }
}

// Make sure to export both the interface and the function
export default syncFiles;
export { SyncOptions }; 