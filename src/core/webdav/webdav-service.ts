import { Verbosity } from '../interfaces/logger';
import { WebDAVConnectivityOptions, WebDAVServiceOptions, WebDAVClientOptions, UploadResult, DirectoryResult } from '../interfaces/webdav';
/**
 * WebDAV Service
 * Main service that composes all WebDAV related services
 */

import * as logger from '../../utils/logger';
import { createWebDAVClient } from './webdav-client-factory';
import { WebDAVDirectoryService } from './webdav-directory-service';
import { WebDAVFileService } from './webdav-file-service';
import { WebDAVConnectivityService } from './webdav-connectivity-service';

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
    try {
      return await this.directoryService.createDirectory(dirPath, targetDir);
    } catch (error) {
      logger.error(`Failed to create directory: ${error.message}`);
      return false;
    }
  }

  /**
   * Create a nested directory structure
   * @param {string} targetDir - The target directory path
   * @returns {Promise<boolean>} True if successful
   */
  async createDirectoryStructure(targetDir) {
    try {
      return await this.directoryService.createDirectoryStructure(targetDir);
    } catch (error) {
      logger.error(`Failed to create directory structure: ${error.message}`);
      return false;
    }
  }

  /**
   * Check if the WebDAV server is accessible
   * @returns {Promise<boolean>} True if the server is accessible
   */
  async checkConnectivity() {
    try {
      return await this.connectivityService.checkConnectivity();
    } catch (error) {
      logger.error(`Failed to check connectivity: ${error.message}`);
      return false;
    }
  }

  /**
   * Upload a file using WebDAV client
   * @param {string} filePath - Path to the file to upload
   * @param {string} targetPath - Target path on the server
   * @param {number} timeoutSeconds - Timeout in seconds
   * @returns {Promise<boolean>} True if successful
   */
  async uploadFile(filePath, targetPath, timeoutSeconds = 60) {
    try {
      return await this.fileService.uploadFile(filePath, targetPath, timeoutSeconds);
    } catch (error) {
      logger.error(`Failed to upload file: ${error.message}`);
      return false;
    }
  }
} 