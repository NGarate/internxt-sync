/**
 * WebDAV File Service
 * Handles WebDAV file operations such as uploading
 */

import * as logger from '../../utils/logger.js';
import { urlEncodePath } from '../../utils/fs-utils.js';
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
   * Upload a file using WebDAV client
   * @param {string} filePath - Path to the file to upload
   * @param {string} targetPath - Target path on the server
   * @param {number} timeoutSeconds - Timeout in seconds (unused, kept for compatibility)
   * @returns {Promise<{success: boolean, output: string}>} Upload result
   */
  async uploadFile(filePath, targetPath, timeoutSeconds = 60) {
    try {
      logger.verbose(`Uploading file: ${filePath} to /${targetPath}`, this.verbosity);
      
      const encodedPath = urlEncodePath(targetPath);
      
      // Read the file
      const fileContent = await fs.promises.readFile(filePath);
      
      // Upload using WebDAV client
      await this.client.putFileContents(encodedPath, fileContent);
      
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
      const encodedPath = urlEncodePath(dirPath);
      return await this.client.getDirectoryContents(encodedPath);
    } catch (error) {
      logger.error(`Failed to get directory contents: ${error.message}`, this.verbosity);
      return [];
    }
  }
} 