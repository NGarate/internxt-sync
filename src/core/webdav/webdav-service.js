/**
 * WebDAV Service
 * Main service that composes all WebDAV related services
 */

import * as logger from '../../utils/logger.js';
import { createWebDAVClient } from './webdav-client-factory.js';
import { WebDAVDirectoryService } from './webdav-directory-service.js';
import { WebDAVFileService } from './webdav-file-service.js';
import { WebDAVConnectivityService } from './webdav-connectivity-service.js';

/**
 * Main WebDAV service that composes specialized services
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
    
    // Create the client
    this.client = createWebDAVClient(webdavUrl);
    
    // Create specialized services
    this.directoryService = new WebDAVDirectoryService(this.client, verbosity);
    this.fileService = new WebDAVFileService(this.client, verbosity);
    this.connectivityService = new WebDAVConnectivityService(this.client, verbosity);
  }

  /**
   * Create a directory on the WebDAV server
   * @param {string} dirPath - The directory path to create
   * @param {string} targetDir - Base target directory (optional)
   * @returns {Promise<boolean>} True if successful
   */
  async createDirectory(dirPath, targetDir = '') {
    return this.directoryService.createDirectory(dirPath, targetDir);
  }

  /**
   * Create a nested directory structure
   * @param {string} targetDir - The target directory path
   * @returns {Promise<boolean>} True if successful
   */
  async createDirectoryStructure(targetDir) {
    return this.directoryService.createDirectoryStructure(targetDir);
  }

  /**
   * Check if the WebDAV server is accessible
   * @returns {Promise<boolean>} True if the server is accessible
   */
  async checkConnectivity() {
    return this.connectivityService.checkConnectivity();
  }

  /**
   * Upload a file using WebDAV client
   * @param {string} filePath - Path to the file to upload
   * @param {string} targetPath - Target path on the server
   * @param {number} timeoutSeconds - Timeout in seconds
   * @returns {Promise<{success: boolean, output: string}>} Upload result
   */
  async uploadFile(filePath, targetPath, timeoutSeconds = 60) {
    return this.fileService.uploadFile(filePath, targetPath, timeoutSeconds);
  }
} 