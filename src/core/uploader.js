/**
 * WebDAV Uploader for Internxt
 * Handles file uploads to the WebDAV server
 */

import { spawn } from 'child_process';
import path from 'path';
import chalk from 'chalk';
import * as logger from '../utils/logger.js';
import { urlEncodePath } from '../utils/fs-utils.js';
import WebDAVService from './webdav-service.js';
import { createInteractiveProcess } from '../utils/command-runner.js';

/**
 * WebDAV Uploader class to handle file uploads
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
    this.concurrentUploads = concurrentUploads;
    this.targetDir = targetDir.trim().replace(/^\/+|\/+$/g, '');
    this.verbosity = verbosity;
    this.activeUploads = new Set();
    this.pendingFiles = [];
    this.completedFiles = 0;
    this.failedFiles = 0;
    this.totalFiles = 0;
    this.progressUpdateInterval = null;
    this.fileScanner = null;
    this.webdavService = new WebDAVService(webdavUrl, verbosity);
  }

  /**
   * Set the file scanner to use for recording uploaded files
   * @param {FileScanner} scanner - The file scanner instance
   */
  setFileScanner(scanner) {
    this.fileScanner = scanner;
  }

  /**
   * Upload a file to the WebDAV server
   * @param {Object} fileInfo - Information about the file to upload
   * @returns {Promise<Object>} Upload result
   */
  async uploadFile(fileInfo) {
    // Mark file as active
    this.activeUploads.add(fileInfo.relativePath);
    
    try {
      // Ensure directory exists
      const dirPath = path.dirname(fileInfo.relativePath);
      if (dirPath !== '.') {
        await this.webdavService.createDirectory(dirPath, this.targetDir);
      } else if (this.targetDir) {
        // If we have a target directory but the file is in the root,
        // ensure the target directory exists
        await this.webdavService.createDirectory('', this.targetDir);
      }
      
      // Calculate appropriate timeout: at least 60 seconds, plus 1 second per 100KB
      const fileSize = fileInfo.size;
      const timeoutSeconds = Math.max(60, Math.ceil(fileSize / (100 * 1024)));
      
      // Combine target directory with relative path
      const targetPath = this.targetDir 
        ? `${this.targetDir}/${fileInfo.relativePath}` 
        : fileInfo.relativePath;
        
      // URL encode the path
      const encodedPath = urlEncodePath(targetPath);
      
      logger.verbose(`Uploading: ${fileInfo.relativePath} (${(fileSize/1024/1024).toFixed(2)} MB) to /${targetPath}`, this.verbosity);
      
      return new Promise((resolve) => {
        // Use spawn instead of exec for better handling of large files
        const curlProcess = createInteractiveProcess('curl', [
          '--insecure',
          '-m', String(timeoutSeconds),
          '-T', fileInfo.absolutePath,
          `${this.webdavUrl}/${encodedPath}`
        ], {}, this.verbosity);
        
        let stderr = '';
        
        curlProcess.stderr.on('data', (data) => {
          stderr += data.toString();
        });
        
        curlProcess.on('close', (code) => {
          if (code === 0) {
            // Success
            if (this.fileScanner) {
              this.fileScanner.updateFileState(fileInfo.relativePath, fileInfo.checksum);
            }
            
            this.completedFiles++;
            
            // Show success message only in verbose mode
            logger.verbose(`✓ Uploaded: ${fileInfo.relativePath}`, this.verbosity);
            
            this.activeUploads.delete(fileInfo.relativePath);
            resolve({
              success: true,
              filePath: fileInfo.relativePath
            });
          } else {
            // Error
            this.failedFiles++;
            
            // Always show errors
            logger.error(`✗ Failed to upload ${fileInfo.relativePath}: ${stderr}`);
            
            this.activeUploads.delete(fileInfo.relativePath);
            resolve({
              success: false,
              filePath: fileInfo.relativePath,
              error: stderr
            });
          }
          
          // Process next file if any pending
          this.processNextFile();
        });
      });
    } catch (error) {
      this.failedFiles++;
      this.activeUploads.delete(fileInfo.relativePath);
      
      // Always show errors
      logger.error(`✗ Failed to upload ${fileInfo.relativePath}: ${error.message}`);
      
      return {
        success: false,
        filePath: fileInfo.relativePath,
        error: error.message
      };
    }
  }

  /**
   * Process the next pending file
   */
  processNextFile() {
    if (this.pendingFiles.length === 0) {
      // No more files to process
      if (this.activeUploads.size === 0) {
        // All uploads completed
        if (this.progressUpdateInterval) {
          clearInterval(this.progressUpdateInterval);
          this.progressUpdateInterval = null;
        }
      }
      return;
    }
    
    // Check if we can start more uploads
    if (this.activeUploads.size < this.concurrentUploads) {
      const fileInfo = this.pendingFiles.shift();
      this.uploadFile(fileInfo);
    }
  }

  /**
   * Update and display the progress bar
   */
  updateProgressBar() {
    // Always show progress bar, even in quiet mode
    const totalToProcess = this.totalFiles;
    const processed = this.completedFiles + this.failedFiles;
    const percentage = totalToProcess > 0 ? Math.floor((processed / totalToProcess) * 100) : 0;
    const barWidth = 30;
    const completeWidth = Math.floor((percentage / 100) * barWidth);
    const bar = "█".repeat(completeWidth) + "░".repeat(barWidth - completeWidth);

    // Use carriage return to move to the beginning of the line
    process.stdout.write(`\r[${bar}] ${percentage}% | ${processed}/${totalToProcess}`);
    
    if (processed === totalToProcess && totalToProcess > 0) {
      process.stdout.write("\n");
      if (this.progressUpdateInterval) {
        clearInterval(this.progressUpdateInterval);
        this.progressUpdateInterval = null;
      }
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
    await this.webdavService.createDirectoryStructure(this.targetDir);
    
    if (filesToUpload.length === 0) {
      logger.success("All files are up to date.", this.verbosity);
      return;
    }

    // Initialize counters
    this.totalFiles = filesToUpload.length;
    this.completedFiles = 0;
    this.failedFiles = 0;
    this.pendingFiles = [...filesToUpload];
    this.activeUploads.clear();
    
    // Log the start message BEFORE displaying the progress bar
    logger.info(`Starting parallel upload with ${this.concurrentUploads} concurrent uploads...`, this.verbosity);
    
    // Setup progress updates
    this.updateProgressBar(); // Initial display
    
    // Set up the interval AFTER initial display
    this.progressUpdateInterval = setInterval(() => this.updateProgressBar(), 100);
    
    try {
      // Start initial batch of uploads
      const initialBatchSize = Math.min(this.concurrentUploads, this.pendingFiles.length);
      for (let i = 0; i < initialBatchSize; i++) {
        this.processNextFile();
      }
      
      // Wait for all uploads to complete
      await new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (this.pendingFiles.length === 0 && this.activeUploads.size === 0) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 500);
      });
      
      // Final update to state file if we have a file scanner
      if (this.fileScanner) {
        this.fileScanner.recordCompletion();
        await this.fileScanner.saveState();
      }

      // Show result (always show the final summary)
      if (this.failedFiles === 0) {
        logger.always(chalk.green(`\nUpload completed successfully! All ${this.completedFiles} files uploaded.`));
      } else {
        logger.always(chalk.yellow(`\nUpload completed with issues: ${this.completedFiles} succeeded, ${this.failedFiles} failed.`));
      }
    } catch (error) {
      logger.error(`\nUpload process failed: ${error}`);
      
      // Save current state if possible
      if (this.fileScanner) {
        await this.fileScanner.saveState();
      }
    } finally {
      // Make sure to clear the interval if it's still running
      if (this.progressUpdateInterval) {
        clearInterval(this.progressUpdateInterval);
        this.progressUpdateInterval = null;
      }
    }
  }
} 