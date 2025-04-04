import { Verbosity } from '../interfaces/logger';
import { WebDAVConnectivityOptions, WebDAVServiceOptions, WebDAVClientOptions, UploadResult, DirectoryResult } from '../interfaces/webdav';
/**
 * WebDAV Directory Service
 * Handles WebDAV directory operations
 */

import * as logger from '../../utils/logger';

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
    // Track directories we've already announced as prepared
    this.announcedDirectories = new Set();
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
      
      // If directory already exists (400, 405 Method Not Allowed or 409 Conflict), consider it a success
      if (statusCode === 400 || statusCode === 405 || statusCode === 409) {
        // Only log at verbose level since this is often expected
        logger.verbose(`Directory already exists: ${dirPath} (status: ${statusCode})`, this.verbosity);
        this.createdDirectories.add(this.normalizePath(dirPath));
        return true;
      }
      
      // Only log at verbose level to reduce noise
      logger.verbose(`Directory creation error (${statusCode}): ${error.message}`, this.verbosity);
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
    
    // Normalize the target directory
    const normalizedTarget = this.normalizePath(targetDir);
    
    // Skip if we've already announced this directory as prepared
    if (this.announcedDirectories.has(normalizedTarget)) {
      logger.verbose(`Directory structure already prepared: /${normalizedTarget}`, this.verbosity);
      return true;
    }
    
    logger.verbose(`Preparing directory structure: /${normalizedTarget}`, this.verbosity);
    
    try {
      // Split the target directory into path segments
      const segments = normalizedTarget.split('/').filter(segment => segment);
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
          // Log as verbose instead of warning to reduce noise
          logger.verbose(`Failed to create directory segment: /${normalizedPath} after multiple attempts`, this.verbosity);
          // Continue anyway and try to upload the file
        }
      }
      
      // Only announce success if we haven't already announced this directory
      if (!this.announcedDirectories.has(normalizedTarget)) {
        // Ensure that the success message appears on its own line
        logger.success(`Directory structure prepared: /${normalizedTarget}`, this.verbosity);
        // Track that we've announced this directory
        this.announcedDirectories.add(normalizedTarget);
      }
      
      return true;
    } catch (error) {
      // Only show as warning for unexpected errors
      logger.verbose(`Directory structure error: ${error.message}`, this.verbosity);
      logger.verbose(`Directory structure might already exist or couldn't be created. Continuing anyway.`, this.verbosity);
      return false;
    }
  }

  /**
   * Check if a directory exists on the WebDAV server
   * @param {string} dirPath - The directory path to check
   * @returns {Promise<boolean>} True if the directory exists
   */
  async checkDirectoryExists(dirPath) {
    try {
      // Normalize the path
      const normalizedPath = this.normalizePath(dirPath);
      
      logger.verbose(`Checking if directory exists: /${normalizedPath}`, this.verbosity);
      
      // Try to get directory contents to check if it exists
      await this.client.getDirectoryContents(normalizedPath);
      
      // If we get here, the directory exists
      logger.verbose(`Directory exists: /${normalizedPath}`, this.verbosity);
      return true;
    } catch (error) {
      // If we get a 404, the directory doesn't exist
      if (error.response?.status === 404) {
        logger.verbose(`Directory does not exist: /${dirPath}`, this.verbosity);
        return false;
      }
      
      // Any other error, log it but assume directory doesn't exist
      logger.verbose(`Error checking if directory exists: ${error.message}`, this.verbosity);
      return false;
    }
  }
} 