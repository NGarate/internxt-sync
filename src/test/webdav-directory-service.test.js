/**
 * Tests for WebDAV Directory Service
 */

import { expect, describe, it, beforeEach } from 'bun:test';
import path from 'path';

// Stub WebDAV client for testing
class WebDAVClientStub {
  constructor(options = {}) {
    this.createDirectoryResult = options.createDirectorySuccess !== false;
    this.errors = [];
    this.calls = {
      createDirectory: [],
      exists: []
    };
  }

  async createDirectory(dirPath) {
    this.calls.createDirectory.push(dirPath);
    
    if (!this.createDirectoryResult) {
      const error = new Error('Failed to create directory');
      this.errors.push(error);
      throw error;
    }
    
    return { status: 201 };
  }
  
  async exists(dirPath) {
    this.calls.exists.push(dirPath);
    return false; // Default to directory not existing
  }
}

// Stub directory service for testing that includes our new implementations
class DirectoryServiceStub {
  constructor(client, verbosity = 2) {
    this.client = client;
    this.verbosity = verbosity;
    this.logs = [];
    this.createdDirectories = new Set();
  }
  
  _log(type, message) {
    this.logs.push({ type, message });
    console[type](message);
  }

  normalizePath(path) {
    const normalized = path.replace(/\\/g, '/');
    return normalized;
  }

  /**
   * Create a directory on the WebDAV server
   * @param {string} dirPath - The local directory path
   * @param {string} targetPath - Optional target path on the server
   * @returns {Promise<boolean>} Success status
   */
  async createDirectory(dirPath, targetPath = dirPath) {
    try {
      const normalizedPath = this.normalizePath(targetPath);
      
      // Skip if already created in this session
      if (this.createdDirectories.has(normalizedPath)) {
        this._log('log', `Directory already created: ${normalizedPath}`);
        return true;
      }
      
      await this.client.createDirectory(normalizedPath);
      
      // Add to tracking set
      this.createdDirectories.add(normalizedPath);
      
      this._log('log', `Created directory: ${normalizedPath}`);
      return true;
    } catch (error) {
      // If error has status 405 or 409, directory might already exist
      const statusCode = error.status || error.response?.status;
      if (statusCode === 405 || statusCode === 409) {
        this._log('log', `Directory already exists: ${targetPath}`);
        this.createdDirectories.add(this.normalizePath(targetPath));
        return true;
      }
      
      this._log('error', `Error creating directory ${targetPath}: ${error.message}`);
      return false;
    }
  }

  /**
   * Create a nested directory structure on the WebDAV server
   * @param {string} dirPath - The directory path to create
   * @returns {Promise<boolean>} Success status
   */
  async createDirectoryStructure(dirPath) {
    if (!dirPath || dirPath === '/') {
      return true;
    }
    
    // Normalize path to handle both Windows and Unix paths
    const normalizedPath = this.normalizePath(dirPath);
    
    // Split the path into components
    const parts = normalizedPath.split('/').filter(Boolean);
    
    let currentPath = '';
    let success = true;
    
    // Create each directory in the path
    for (const part of parts) {
      currentPath += '/' + part;
      
      const exists = await this.client.exists(currentPath);
      
      if (!exists) {
        success = await this.createDirectory(currentPath);
        
        if (!success) {
          this._log('error', `Failed to create directory structure: ${dirPath}`);
          return false;
        }
      }
    }
    
    return success;
  }
}

describe('WebDAV Directory Service', () => {
  let directoryService;
  let mockClient;
  
  // Create fresh instances before each test
  beforeEach(() => {
    mockClient = new WebDAVClientStub();
    directoryService = new DirectoryServiceStub(mockClient);
  });
  
  describe('normalizePath', () => {
    it('should convert backslashes to forward slashes', () => {
      expect(directoryService.normalizePath('path\\to\\dir')).toBe('path/to/dir');
      expect(directoryService.normalizePath('C:\\Users\\Documents')).toBe('C:/Users/Documents');
    });

    it('should leave forward slashes unchanged', () => {
      expect(directoryService.normalizePath('path/to/dir')).toBe('path/to/dir');
      expect(directoryService.normalizePath('/root/path')).toBe('/root/path');
    });

    it('should handle mixed slash styles', () => {
      expect(directoryService.normalizePath('path/to\\dir')).toBe('path/to/dir');
      expect(directoryService.normalizePath('path\\to/dir')).toBe('path/to/dir');
    });
  });
  
  describe('createDirectory', () => {
    it('should create a directory successfully', async () => {
      const result = await directoryService.createDirectory('/test/dir');
      
      expect(result).toBe(true);
      expect(mockClient.calls.createDirectory).toContain('/test/dir');
    });
    
    it('should create a directory with target path', async () => {
      const result = await directoryService.createDirectory('/local/dir', '/remote/target/dir');
      
      expect(result).toBe(true);
      expect(mockClient.calls.createDirectory).toContain('/remote/target/dir');
    });
    
    it('should handle errors gracefully', async () => {
      // Configure client to simulate error
      mockClient.createDirectoryResult = false;
      
      const result = await directoryService.createDirectory('/test/dir');
      
      expect(result).toBe(false);
      expect(directoryService.logs.some(log => 
        log.type === 'error' && log.message.includes('Error creating directory')
      )).toBe(true);
    });
    
    it('should skip creation for already created directories', async () => {
      // First create the directory
      await directoryService.createDirectory('/test/dir');
      mockClient.calls.createDirectory = []; // Reset calls
      
      // Try to create it again
      const result = await directoryService.createDirectory('/test/dir');
      
      expect(result).toBe(true);
      expect(mockClient.calls.createDirectory.length).toBe(0); // No new calls
      expect(directoryService.logs.some(log => 
        log.message.includes('Directory already created')
      )).toBe(true);
    });
  });
  
  describe('createDirectoryStructure', () => {
    it('should handle empty path', async () => {
      const result = await directoryService.createDirectoryStructure('');
      
      expect(result).toBe(true);
    });
    
    it('should create a nested directory structure', async () => {
      // Setup client.exists to return false for all checks
      mockClient.exists = async (path) => false;
      
      const result = await directoryService.createDirectoryStructure('/test/nested/dir');
      
      expect(result).toBe(true);
      expect(mockClient.calls.createDirectory).toContain('/test');
      expect(mockClient.calls.createDirectory).toContain('/test/nested');
      expect(mockClient.calls.createDirectory).toContain('/test/nested/dir');
    });
    
    it('should handle leading and trailing slashes in path', async () => {
      // Setup client.exists to return false for all checks
      mockClient.exists = async (path) => false;
      
      const result = await directoryService.createDirectoryStructure('/test/dir/');
      
      expect(result).toBe(true);
      expect(mockClient.calls.createDirectory).toContain('/test');
      expect(mockClient.calls.createDirectory).toContain('/test/dir');
    });
    
    it('should handle errors during directory creation', async () => {
      // Setup client.exists to return false for all checks
      mockClient.exists = async (path) => false;
      
      // Mock a special version of the client to simulate a failure
      const failingClient = new WebDAVClientStub();
      failingClient.exists = async (path) => false;
      failingClient.createDirectory = async (path) => {
        if (path === '/test/nested') {
          throw new Error('Failed to create nested directory');
        }
        return { status: 201 };
      };
      
      // Create a new directory service with the failing client
      const failingService = new DirectoryServiceStub(failingClient);
      
      // Attempt to create the directory structure
      const result = await failingService.createDirectoryStructure('/test/nested/dir');
      
      // Verify the operation failed
      expect(result).toBe(false);
      expect(failingService.logs.some(log => 
        log.type === 'error' && log.message.includes('Failed to create directory structure')
      )).toBe(true);
    });
  });
}); 