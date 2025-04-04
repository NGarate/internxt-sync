import { Verbosity } from '../interfaces/logger';
import { WebDAVConnectivityOptions, WebDAVServiceOptions, WebDAVClientOptions, UploadResult, DirectoryResult } from '../interfaces/webdav';
/**
 * WebDAV File Service
 * Handles WebDAV file operations such as uploading
 */

import * as logger from '../../utils/logger';
import * as fs from 'fs';

/**
 * Service class for WebDAV file operations
 */
export class WebDAVFileService {
  /**
   * Create a new WebDAV File Service
   * @param {Object} client - WebDAV client instance
   * @param {number} verbosity - Verbosity level
   */
  constructor(client, verbosity = logger.Verbosity.Normal) {
    this.client = client;
    this.verbosity = verbosity;
  }

  /**
   * Normalize a path by replacing backslashes with forward slashes
   * @param {string} path - The path to normalize
   * @returns {string} The normalized path
   */
  normalizePath(path) {
    const normalized = path.replace(/\\/g, '/');
    logger.verbose(`Path normalized: "${path}" → "${normalized}"`, this.verbosity);
    return normalized;
  }

  /**
   * Upload a file using WebDAV client
   * @param {string} filePath - Path to the file to upload
   * @param {string} targetPath - Target path on the server
   * @param {number} timeoutSeconds - Timeout in seconds (unused, kept for compatibility)
   * @returns {Promise<{success: boolean, output: string}>} Upload result
   */
  async uploadFile(filePath, targetPath, timeoutSeconds = 60) {
    try {
      logger.verbose(`Uploading file: ${filePath} to /${targetPath}`, this.verbosity);
      
      const normalizedPath = this.normalizePath(targetPath);
      logger.verbose(`Using normalized path for upload: "${normalizedPath}"`, this.verbosity);
      
      // Read the file
      const fileContent = await fs.promises.readFile(filePath);
      
      // Upload using WebDAV client
      await this.client.putFileContents(normalizedPath, fileContent);
      
      // Only log at verbose level since the success will be logged by the uploader
      logger.verbose(`File upload completed: ${filePath}`, this.verbosity);
      
      // Return success with newline in message
      return { success: true, output: 'File uploaded successfully' };
    } catch (error) {
      logger.error(`Failed to upload file: ${error.message}`);
      return { success: false, output: error.message };
    }
  }
  
  /**
   * Get contents of a directory
   * @param {string} dirPath - Path to the directory
   * @returns {Promise<Array>} Directory contents
   */
  async getDirectoryContents(dirPath = '/') {
    try {
      const normalizedPath = this.normalizePath(dirPath);
      return await this.client.getDirectoryContents(normalizedPath);
    } catch (error) {
      logger.error(`Failed to get directory contents: ${error.message}`);
      return [];
    }
  }

  /**
   * Upload a file with progress tracking
   * @param {string} filePath - Path to the file to upload
   * @param {string} targetPath - Target path on the server
   * @param {Function} progressCallback - Callback for progress updates
   * @param {number} timeoutSeconds - Timeout in seconds (unused, kept for compatibility)
   * @returns {Promise<{success: boolean, output: string}>} Upload result
   */
  async uploadFileWithProgress(filePath, targetPath, progressCallback, timeoutSeconds = 60) {
    try {
      logger.verbose(`Uploading file with progress tracking: ${filePath} to /${targetPath}`, this.verbosity);
      
      const normalizedPath = this.normalizePath(targetPath);
      logger.verbose(`Using normalized path for upload: "${normalizedPath}"`, this.verbosity);
      
      // Get file stats to calculate total size
      const stats = await fs.promises.stat(filePath);
      const totalSize = stats.size;
      
      // Read the file
      const fileContent = await fs.promises.readFile(filePath);
      
      // Call progress callback with 0% progress
      if (typeof progressCallback === 'function') {
        progressCallback({ 
          percent: 0, 
          loaded: 0, 
          total: totalSize,
          filePath,
          targetPath: normalizedPath
        });
      }
      
      // Upload using WebDAV client
      await this.client.putFileContents(normalizedPath, fileContent);
      
      // Call progress callback with 100% progress
      if (typeof progressCallback === 'function') {
        progressCallback({ 
          percent: 100, 
          loaded: totalSize, 
          total: totalSize,
          filePath,
          targetPath: normalizedPath
        });
      }
      
      // Only log at verbose level since the success will be logged by the uploader
      logger.verbose(`File upload with progress tracking completed: ${filePath}`, this.verbosity);
      
      // Return success with newline in message
      return { success: true, output: 'File uploaded successfully' };
    } catch (error) {
      logger.error(`Failed to upload file with progress tracking: ${error.message}`);
      return { success: false, output: error.message };
    }
  }
} 