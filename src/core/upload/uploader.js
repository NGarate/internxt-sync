/**
 * WebDAV Uploader
 * Handles file uploads to the WebDAV server with improved modularity
 */

import path from 'path';
import os from 'os';
import * as logger from '../../utils/logger.js';
import WebDAVService from '../webdav-service.js';
import { HashCache } from './hash-cache.js';
import { ProgressTracker } from './progress-tracker.js';
import { FileUploadManager } from './file-upload-manager.js';

/**
 * WebDAV Uploader class with improved modularity
 */
export default class Uploader {
  /**
   * Create a new WebDAV Uploader
   * @param {string} webdavUrl - The WebDAV server URL
   * @param {number} concurrentUploads - Number of concurrent uploads
   * @param {string} targetDir - The target directory on the WebDAV server
   * @param {number} verbosity - Verbosity level
   */
  constructor(webdavUrl, concurrentUploads, targetDir = '', verbosity = logger.Verbosity.Normal) {
    this.webdavUrl = webdavUrl;
    this.targetDir = targetDir.trim().replace(/^\/+|\/+$/g, '');
    this.verbosity = verbosity;
    
    // Initialize services
    this.webdavService = new WebDAVService(webdavUrl, verbosity);
    this.hashCache = new HashCache(
      path.join(os.tmpdir(), 'internxt-hash-cache.json'),
      verbosity
    );
    this.progressTracker = new ProgressTracker(verbosity);
    this.uploadManager = new FileUploadManager(
      concurrentUploads,
      this.handleFileUpload.bind(this),
      verbosity
    );
    
    // Load hash cache on construction
    this.hashCache.load();
    
    // Initialize state
    this.fileScanner = null;
  }

  /**
   * Set the file scanner to use for recording uploaded files
   * @param {FileScanner} scanner - The file scanner instance
   */
  setFileScanner(scanner) {
    this.fileScanner = scanner;
    logger.verbose('File scanner set', this.verbosity);
  }

  /**
   * Handle the upload of a single file
   * @param {Object} fileInfo - File information object
   * @returns {Promise<{success: boolean, filePath: string}>} Upload result
   */
  async handleFileUpload(fileInfo) {
    try {
      // Check if file has changed
      const hasChanged = await this.hashCache.hasChanged(fileInfo.absolutePath);
      
      if (!hasChanged) {
        logger.verbose(`File ${fileInfo.relativePath} has not changed, skipping upload`, this.verbosity);
        this.progressTracker.recordSuccess();
        return { success: true, filePath: fileInfo.relativePath };
      }

      logger.verbose(`File ${fileInfo.relativePath} has changed, uploading...`, this.verbosity);
      
      // Create target directory if it doesn't exist
      if (this.targetDir) {
        await this.webdavService.createDirectoryStructure(this.targetDir);
      }

      // Construct the target path
      const targetPath = this.targetDir 
        ? `${this.targetDir}/${fileInfo.relativePath}` 
        : fileInfo.relativePath;
      
      // Upload the file
      const result = await this.webdavService.uploadFile(fileInfo.absolutePath, targetPath);
      
      if (result.success) {
        logger.success(`Successfully uploaded ${fileInfo.relativePath}`, this.verbosity);
        // Update file scanner if available
        if (this.fileScanner) {
          this.fileScanner.updateFileState(fileInfo.relativePath, fileInfo.checksum);
        }
        this.progressTracker.recordSuccess();
        return { success: true, filePath: fileInfo.relativePath };
      } else {
        logger.error(`Failed to upload ${fileInfo.relativePath}: ${result.output}`);
        this.progressTracker.recordFailure();
        return { success: false, filePath: fileInfo.relativePath };
      }
    } catch (error) {
      logger.error(`Error uploading file ${fileInfo.relativePath}: ${error.message}`);
      this.progressTracker.recordFailure();
      return { success: false, filePath: fileInfo.relativePath };
    }
  }

  /**
   * Start the upload process
   * @param {Array} filesToUpload - Array of files to upload
   * @returns {Promise<void>}
   */
  async startUpload(filesToUpload) {
    if (!this.webdavUrl) {
      logger.error("WebDAV URL is not available. Setup may have failed.");
      return;
    }
    
    // Check connectivity first
    if (!await this.webdavService.checkConnectivity()) {
      return;
    }
    
    // Create the target directory structure if needed
    if (this.targetDir) {
      await this.webdavService.createDirectoryStructure(this.targetDir);
    }
    
    if (filesToUpload.length === 0) {
      logger.success("All files are up to date.", this.verbosity);
      return;
    }

    // Initialize progress tracker
    this.progressTracker.initialize(filesToUpload.length);
    this.progressTracker.startProgressUpdates();
    
    // Set up upload manager
    this.uploadManager.setQueue(filesToUpload);
    
    try {
      // Start upload and wait for completion
      await new Promise((resolve) => {
        this.uploadManager.start(resolve);
      });
      
      // Final update to state file if we have a file scanner
      if (this.fileScanner) {
        this.fileScanner.recordCompletion();
        await this.fileScanner.saveState();
      }

      // Show result summary
      this.progressTracker.displaySummary();
    } catch (error) {
      logger.error(`\nUpload process failed: ${error}`);
      
      // Save current state if possible
      if (this.fileScanner) {
        await this.fileScanner.saveState();
      }
    } finally {
      // Stop progress updates
      this.progressTracker.stopProgressUpdates();
    }
  }
} 