/**
 * WebDAV Service
 * Handles low-level WebDAV operations like directory creation and connectivity checks
 */

import { promisify } from 'util';
import { exec } from 'child_process';
import * as logger from '../utils/logger.js';
import { urlEncodePath } from '../utils/fs-utils.js';
import { runCommand } from '../utils/command-runner.js';

const execAsync = promisify(exec);

/**
 * WebDAV Service class for handling WebDAV operations
 */
export default class WebDAVService {
  /**
   * Create a new WebDAV Service
   * @param {string} webdavUrl - The WebDAV server URL
   * @param {number} verbosity - Verbosity level
   */
  constructor(webdavUrl, verbosity = logger.Verbosity.Normal) {
    this.webdavUrl = webdavUrl;
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
      await runCommand(`curl --insecure -X MKCOL "${this.webdavUrl}/${encodedPath}"`, {}, this.verbosity);
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
          await runCommand(`curl --insecure -X MKCOL "${this.webdavUrl}/${encodedPath}"`, {}, this.verbosity);
        }
      }
      
      logger.success(`Directory structure prepared: /${targetDir}`, this.verbosity);
      return true;
    } catch (error) {
      logger.warning(`Directory structure might already exist or couldn't be created. Continuing anyway.`, this.verbosity);
      return false;
    }
  }

  /**
   * Check if the WebDAV server is accessible
   * @returns {Promise<boolean>} True if the server is accessible
   */
  async checkConnectivity() {
    try {
      const result = await runCommand(
        `curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 --insecure ${this.webdavUrl}`,
        {},
        this.verbosity
      );
      
      const statusCode = parseInt(result.stdout.trim(), 10);
      
      if (statusCode >= 200 && statusCode < 500) {
        logger.success(`WebDAV server is reachable (status code: ${statusCode})`, this.verbosity);
        return true;
      } else {
        logger.error(`WebDAV server returned error status: ${statusCode}`);
        return false;
      }
    } catch (error) {
      logger.error(`Failed to connect to WebDAV server: ${error}`);
      return false;
    }
  }

  /**
   * Upload a file using curl
   * @param {string} filePath - Path to the file to upload
   * @param {string} targetPath - Target path on the server
   * @param {number} timeoutSeconds - Timeout in seconds
   * @returns {Promise<{success: boolean, output: string}>} Upload result
   */
  async uploadFile(filePath, targetPath, timeoutSeconds = 60) {
    try {
      const encodedPath = urlEncodePath(targetPath);
      
      const result = await runCommand(
        `curl --insecure -m ${timeoutSeconds} -T "${filePath}" "${this.webdavUrl}/${encodedPath}"`,
        {},
        this.verbosity
      );
      
      return { success: true, output: result.stdout };
    } catch (error) {
      return { success: false, output: error.message };
    }
  }
} 