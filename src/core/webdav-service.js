/**
 * WebDAV Service
 * Handles low-level WebDAV operations like directory creation and connectivity checks
 * 
 * This file is kept for backwards compatibility and delegates to the new implementation
 */

import WebDAVServiceImpl from './webdav/webdav-service.js';

/**
 * WebDAV Service class for handling WebDAV operations
 * @deprecated Use the new implementation in core/webdav directory
 */
export default class WebDAVService extends WebDAVServiceImpl {
  // This class extends the new implementation for backwards compatibility
} 