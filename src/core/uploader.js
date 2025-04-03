/**
 * WebDAV Uploader for Internxt
 * Handles file uploads to the WebDAV server
 * 
 * This file delegates to the new modular implementation
 */

import UploaderImpl from './upload/uploader.js';

/**
 * WebDAV Uploader class to handle file uploads
 * @deprecated Use the new implementation in core/upload directory
 */
export default class Uploader extends UploaderImpl {
  // This class extends the new implementation for backwards compatibility
} 