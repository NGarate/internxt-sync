import { Verbosity } from '../interfaces/logger';
import { WebDAVConnectivityOptions, WebDAVServiceOptions, WebDAVClientOptions, UploadResult, DirectoryResult } from '../interfaces/webdav';
/**
 * WebDAV Connectivity Service
 * Handles checking WebDAV server connectivity
 */

import * as logger from '../../utils/logger';

/**
 * Service class for WebDAV connectivity operations
 */
export class WebDAVConnectivityService {
  /**
   * Create a new WebDAV Connectivity Service
   * @param {Object} client - WebDAV client instance
   * @param {number} verbosity - Verbosity level
   */
  constructor(client, verbosity = logger.Verbosity.Normal) {
    this.client = client;
    this.verbosity = verbosity;
  }

  /**
   * Check if the WebDAV server is accessible
   * @param {string} path - The path to check (defaults to root)
   * @returns {Promise<boolean>} True if the server is accessible
   */
  async checkConnectivity(path = '/') {
    try {
      // Try to list the directory at the specified path
      logger.verbose(`Checking WebDAV connectivity by listing directory contents at ${path}`, this.verbosity);
      await this.client.getDirectoryContents(path);
      logger.verbose(`WebDAV server is reachable via directory listing`, this.verbosity);
      logger.success(`WebDAV server is reachable`, this.verbosity);
      return true;
    } catch (error) {
      logger.warning(`Directory listing check failed: ${error.message}`, this.verbosity);
      
      // Fallback to quota check if directory listing fails
      try {
        logger.verbose(`Trying quota check as fallback for connectivity test`, this.verbosity);
        await this.client.getQuota();
        logger.verbose(`WebDAV server is reachable via quota check`, this.verbosity);
        logger.success(`WebDAV server is reachable (via quota check)`, this.verbosity);
        return true;
      } catch (quotaError) {
        logger.warning(`Quota check also failed: ${quotaError.message}`, this.verbosity);
        logger.error(`Failed to connect to WebDAV server: ${error.message}`, this.verbosity);
        return false;
      }
    }
  }
  
  /**
   * Check if the server is compatible with WebDAV standards
   * @returns {Promise<boolean>} True if the server is compatible
   */
  async checkServerCompatibility() {
    try {
      logger.verbose(`Checking WebDAV server compatibility`, this.verbosity);
      const compatibility = await this.client.checkServerCompatibility();
      logger.verbose(`Server compatibility: ${JSON.stringify(compatibility)}`, this.verbosity);
      return true;
    } catch (error) {
      logger.warning(`WebDAV server compatibility check failed: ${error.message}`, this.verbosity);
      return false;
    }
  }
  
  /**
   * Get the available free space on the WebDAV server
   * @returns {Promise<number|null>} Free space in bytes or null if not available
   */
  async getFreeSpace() {
    try {
      logger.verbose(`Getting WebDAV server free space`, this.verbosity);
      const freeSpace = await this.client.getFreeSpace();
      logger.verbose(`WebDAV server free space: ${freeSpace} bytes`, this.verbosity);
      return freeSpace;
    } catch (error) {
      logger.warning(`Failed to get WebDAV server free space: ${error.message}`, this.verbosity);
      return null;
    }
  }
  
  /**
   * Get the used space on the WebDAV server
   * @returns {Promise<number|null>} Used space in bytes or null if not available
   */
  async getUsedSpace() {
    try {
      logger.verbose(`Getting WebDAV server used space`, this.verbosity);
      const usedSpace = await this.client.getUsedSpace();
      logger.verbose(`WebDAV server used space: ${usedSpace} bytes`, this.verbosity);
      return usedSpace;
    } catch (error) {
      logger.warning(`Failed to get WebDAV server used space: ${error.message}`, this.verbosity);
      return null;
    }
  }
} 