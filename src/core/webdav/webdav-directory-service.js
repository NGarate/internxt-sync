/**
 * WebDAV Directory Service
 * Handles WebDAV directory operations
 */

import * as logger from '../../utils/logger.js';

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
    // Track created directories to avoid redundant creation attempts
    this.createdDirectories = new Set();
  }

  /**
   * Normalize a path by replacing backslashes with forward slashes
   * @param {string} path - The path to normalize
   * @returns {string} The normalized path
   */
  normalizePath(path) {
    const normalized = path.replace(/\\/g, '/');
    logger.verbose(`Directory path normalized: "${path}" → "${normalized}"`, this.verbosity);
    return normalized;
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
        
      // Normalize the path
      const normalizedPath = this.normalizePath(fullDirPath);
      
      // Skip if we've already created this directory
      if (this.createdDirectories.has(normalizedPath)) {
        logger.verbose(`Directory already created in this session: /${normalizedPath}`, this.verbosity);
        return true;
      }
      
      logger.verbose(`Creating directory: /${fullDirPath}`, this.verbosity);
      logger.verbose(`Using normalized path: "${normalizedPath}"`, this.verbosity);
      
      await this.client.createDirectory(normalizedPath);
      logger.verbose(`Directory created successfully: /${normalizedPath}`, this.verbosity);
      
      // Add to tracking set
      this.createdDirectories.add(normalizedPath);
      return true;
    } catch (error) {
      const statusCode = error.response?.status;
      logger.verbose(`Directory creation error (${statusCode}): ${error.message}`, this.verbosity);
      
      // If directory already exists (405 Method Not Allowed or 409 Conflict), consider it a success
      if (statusCode === 405 || statusCode === 409) {
        logger.verbose(`Directory already exists: ${dirPath}`, this.verbosity);
        this.createdDirectories.add(this.normalizePath(dirPath));
        return true;
      }
      
      logger.verbose(`Failed to create directory: ${dirPath}`, this.verbosity);
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
      const segments = targetDir.split('/').filter(segment => segment);
      let currentPath = '';
      
      // Create each segment of the path
      for (const segment of segments) {
        currentPath = currentPath ? `${currentPath}/${segment}` : segment;
        
        // Normalize the path
        const normalizedPath = this.normalizePath(currentPath);
        
        logger.verbose(`Ensuring directory exists: /${currentPath}`, this.verbosity);
        
        // Try up to 3 times to create the directory
        let success = false;
        for (let attempt = 0; attempt < 3 && !success; attempt++) {
          if (attempt > 0) {
            logger.verbose(`Retry attempt ${attempt} for directory: /${normalizedPath}`, this.verbosity);
          }
          
          success = await this.createDirectory(currentPath, '');
          
          if (success) {
            logger.verbose(`Directory segment created/verified: /${normalizedPath}`, this.verbosity);
            break;
          }
          
          // Brief delay before retry
          if (attempt < 2) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
        
        if (!success) {
          logger.warning(`Failed to create directory segment: /${normalizedPath} after multiple attempts`, this.verbosity);
          // Continue anyway and try to upload the file
        }
      }
      
      logger.success(`Directory structure prepared: /${targetDir}`, this.verbosity);
      return true;
    } catch (error) {
      logger.warning(`Directory structure error: ${error.message}`, this.verbosity);
      logger.warning(`Directory structure might already exist or couldn't be created. Continuing anyway.`, this.verbosity);
      return false;
    }
  }
} 