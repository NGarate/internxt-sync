import { WebDAVConnectivityOptions, WebDAVServiceOptions, WebDAVClientOptions, UploadResult, DirectoryResult } from '../interfaces/webdav';
/**
 * WebDAV Client Factory
 * Responsible for creating WebDAV client instances
 */

import { createClient } from 'webdav';

/**
 * Creates a WebDAV client with the provided configuration
 * @param {string} webdavUrl - The WebDAV server URL
 * @param {Object} options - Client configuration options
 * @returns {Object} WebDAV client instance
 */
export function createWebDAVClient(webdavUrl, options = {}) {
  const defaultOptions = {
    username: 'webdav',
    password: 'password'
  };
  
  const clientOptions = { ...defaultOptions, ...options };
  
  return createClient(webdavUrl, clientOptions);
}
