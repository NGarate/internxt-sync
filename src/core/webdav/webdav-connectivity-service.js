/**
 * WebDAV Connectivity Service
 * Handles checking WebDAV server connectivity
 */

import * as logger from '../../utils/logger.js';

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
   * @returns {Promise<boolean>} True if the server is accessible
   */
  async checkConnectivity() {
    try {
      // Try to list the root directory
      await this.client.getDirectoryContents('/');
      logger.success(`WebDAV server is reachable`, this.verbosity);
      return true;
    } catch (error) {
      logger.error(`Failed to connect to WebDAV server: ${error.message}`, this.verbosity);
      return false;
    }
  }
} 