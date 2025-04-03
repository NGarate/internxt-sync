/**
 * WebDAV File Service
 * Handles WebDAV file operations such as uploading
 */

import * as logger from '../../utils/logger.js';
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
      
      logger.success(`File uploaded successfully: ${filePath}`, this.verbosity);
      return { success: true, output: 'File uploaded successfully' };
    } catch (error) {
      logger.error(`Failed to upload file: ${error.message}`, this.verbosity);
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
      logger.error(`Failed to get directory contents: ${error.message}`, this.verbosity);
      return [];
    }
  }
} 