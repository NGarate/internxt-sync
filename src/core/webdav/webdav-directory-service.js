/**
 * WebDAV Directory Service
 * Handles WebDAV directory operations
 */

import * as logger from '../../utils/logger.js';
import { urlEncodePath } from '../../utils/fs-utils.js';

/**
 * Service class for WebDAV directory operations
 */
export class WebDAVDirectoryService {
  /**
   * Create a new WebDAV Directory Service
   * @param {Object} client - WebDAV client instance
   * @param {number} verbosity - Verbosity level
   */
  constructor(client, verbosity = logger.Verbosity.Normal) {
    this.client = client;
    this.verbosity = verbosity;
  }

  /**
   * Create a directory on the WebDAV server
   * @param {string} dirPath - The directory path to create
   * @param {string} targetDir - Base target directory (optional)
   * @returns {Promise<boolean>} True if successful
   */
  async createDirectory(dirPath, targetDir = '') {
    try {
      // Combine target directory with relative path
      const fullDirPath = targetDir 
        ? `${targetDir}/${dirPath}` 
        : dirPath;
        
      // URL encode the path
      const encodedPath = urlEncodePath(fullDirPath);
      
      logger.verbose(`Creating directory: /${fullDirPath}`, this.verbosity);
      await this.client.createDirectory(encodedPath);
      return true;
    } catch (error) {
      logger.verbose(`Directory might already exist: ${dirPath}`, this.verbosity);
      return false;
    }
  }

  /**
   * Create a nested directory structure
   * @param {string} targetDir - The target directory path
   * @returns {Promise<boolean>} True if successful
   */
  async createDirectoryStructure(targetDir) {
    if (!targetDir) {
      return true;
    }
    
    logger.verbose(`Preparing directory structure: /${targetDir}`, this.verbosity);
    
    try {
      // Split the target directory into path segments
      const segments = targetDir.split('/');
      let currentPath = '';
      
      // Create each segment of the path
      for (const segment of segments) {
        if (segment) {
          currentPath = currentPath ? `${currentPath}/${segment}` : segment;
          
          // URL encode the path
          const encodedPath = urlEncodePath(currentPath);
          
          logger.verbose(`Ensuring directory exists: /${currentPath}`, this.verbosity);
          await this.client.createDirectory(encodedPath);
        }
      }
      
      logger.success(`Directory structure prepared: /${targetDir}`, this.verbosity);
      return true;
    } catch (error) {
      logger.warning(`Directory structure might already exist or couldn't be created. Continuing anyway.`, this.verbosity);
      return false;
    }
  }
} 