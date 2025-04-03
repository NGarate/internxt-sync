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
    username: 'internxt',
    password: 'internxt'
  };
  
  const clientOptions = { ...defaultOptions, ...options };
  
  return createClient(webdavUrl, clientOptions);
}

/**
 * Creates a WebDAV client for testing purposes
 * @param {Function} getContentsImpl - Implementation for getDirectoryContents
 * @param {Function} createDirImpl - Implementation for createDirectory
 * @param {Function} putFileImpl - Implementation for putFileContents
 * @returns {Object} Mock WebDAV client
 */
export function createTestClient({
  getContentsImpl = () => Promise.resolve([]),
  createDirImpl = () => Promise.resolve(),
  putFileImpl = () => Promise.resolve()
} = {}) {
  return {
    getDirectoryContents: getContentsImpl,
    createDirectory: createDirImpl,
    putFileContents: putFileImpl
  };
} 