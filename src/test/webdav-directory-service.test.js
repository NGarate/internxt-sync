/**
 * Tests for WebDAV Directory Service
 */

import { expect, describe, it, beforeEach, spyOn, jest } from 'bun:test';
import { WebDAVDirectoryService } from '../core/webdav/webdav-directory-service.js';
import * as logger from '../utils/logger.js';

// WebDAV client stub for testing
class WebDAVClientStub {
  constructor(options = {}) {
    this.createDirectoryResult = options.createDirectorySuccess !== false;
    this.createDirectoryResponseStatus = options.createDirectoryResponseStatus || 201;
    this.directoryExistsResult = options.directoryExistsResult;
    this.calls = {
      createDirectory: [],
      getDirectoryContents: []
    };
    this.errorResponses = options.errorResponses || {};
  }

  async createDirectory(dirPath) {
    this.calls.createDirectory.push(dirPath);
    
    // Check for specific path error responses
    if (this.errorResponses[dirPath]) {
      const error = new Error(this.errorResponses[dirPath].message || 'Failed to create directory');
      if (this.errorResponses[dirPath].status) {
        error.response = { status: this.errorResponses[dirPath].status };
      }
      throw error;
    }
    
    if (!this.createDirectoryResult) {
      const error = new Error('Failed to create directory');
      throw error;
    }
    
    return { status: this.createDirectoryResponseStatus };
  }
  
  async getDirectoryContents(dirPath) {
    this.calls.getDirectoryContents.push(dirPath);
    
    // Check for specific path error responses
    if (this.errorResponses[dirPath]) {
      const error = new Error(this.errorResponses[dirPath].message || 'Failed to get directory contents');
      if (this.errorResponses[dirPath].status) {
        error.response = { status: this.errorResponses[dirPath].status };
      }
      throw error;
    }
    
    if (this.directoryExistsResult === false) {
      const error = new Error('Directory not found');
      error.response = { status: 404 };
      throw error;
    }
    
    return [
      { basename: 'file1.txt', filename: `${dirPath}/file1.txt`, type: 'file' },
      { basename: 'file2.txt', filename: `${dirPath}/file2.txt`, type: 'file' }
    ];
  }
}

describe('WebDAV Directory Service', () => {
  let directoryService;
  let mockClient;
  let successSpy;
  let verboseSpy;
  let warningSpy;

  // Setup before each test
  beforeEach(() => {
    mockClient = new WebDAVClientStub();
    directoryService = new WebDAVDirectoryService(mockClient);
    
    // Create spies for logger functions
    successSpy = spyOn(logger, 'success');
    verboseSpy = spyOn(logger, 'verbose');
    warningSpy = spyOn(logger, 'warning');
  });
  
  describe('constructor', () => {
    it('should initialize with the provided client and verbosity', () => {
      const testClient = {};
      const testVerbosity = logger.Verbosity.Verbose;
      
      const service = new WebDAVDirectoryService(testClient, testVerbosity);
      
      expect(service.client).toBe(testClient);
      expect(service.verbosity).toBe(testVerbosity);
    });
    
    it('should use default verbosity if not provided', () => {
      const testClient = {};
      
      const service = new WebDAVDirectoryService(testClient);
      
      expect(service.client).toBe(testClient);
      expect(service.verbosity).toBe(logger.Verbosity.Normal);
    });
    
    it('should initialize an empty set for tracking created directories', () => {
      const service = new WebDAVDirectoryService({});
      
      expect(service.createdDirectories).toBeInstanceOf(Set);
      expect(service.createdDirectories.size).toBe(0);
    });
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
    
    it('should log verbose output when normalizing paths', () => {
      directoryService.normalizePath('path\\to\\dir');
      
      expect(verboseSpy).toHaveBeenCalledWith(
        expect.stringContaining('Directory path normalized'),
        logger.Verbosity.Normal
      );
    });
  });
  
  describe('createDirectory', () => {
    it('should create a directory successfully', async () => {
      const result = await directoryService.createDirectory('/test/dir');
      
      expect(result).toBe(true);
      expect(mockClient.calls.createDirectory).toContain('/test/dir');
      expect(verboseSpy).toHaveBeenCalledWith(
        expect.stringContaining('Directory created successfully'),
        logger.Verbosity.Normal
      );
    });
    
    it('should create a directory with target path', async () => {
      const result = await directoryService.createDirectory('dir', '/remote/target');
      
      expect(result).toBe(true);
      expect(mockClient.calls.createDirectory).toContain('/remote/target/dir');
    });
    
    it('should handle errors gracefully', async () => {
      // Configure client to simulate error
      mockClient.createDirectoryResult = false;
      
      const result = await directoryService.createDirectory('/test/dir');
      
      expect(result).toBe(false);
      expect(verboseSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to create directory'),
        logger.Verbosity.Normal
      );
    });
    
    it('should skip creation for already created directories', async () => {
      // First create the directory
      await directoryService.createDirectory('/test/dir');
      mockClient.calls.createDirectory = []; // Reset calls
      
      // Try to create it again
      const result = await directoryService.createDirectory('/test/dir');
      
      expect(result).toBe(true);
      expect(mockClient.calls.createDirectory.length).toBe(0); // No new calls
      expect(verboseSpy).toHaveBeenCalledWith(
        expect.stringContaining('Directory already created in this session'),
        logger.Verbosity.Normal
      );
    });
    
    it('should handle 405 status code as directory already exists', async () => {
      // Configure client to simulate 405 error
      mockClient = new WebDAVClientStub({
        createDirectoryResult: false,
        errorResponses: {
          '/test/dir': { 
            message: 'Method Not Allowed', 
            status: 405 
          }
        }
      });
      directoryService = new WebDAVDirectoryService(mockClient);
      
      // Setup spy after creating new service
      verboseSpy = spyOn(logger, 'verbose');
      
      const result = await directoryService.createDirectory('/test/dir');
      
      expect(result).toBe(true);
      expect(verboseSpy).toHaveBeenCalledWith(
        expect.stringContaining('Directory already exists'),
        logger.Verbosity.Normal
      );
      expect(directoryService.createdDirectories.has('/test/dir')).toBe(true);
    });
    
    it('should handle 409 status code as directory already exists', async () => {
      // Configure client to simulate 409 error
      mockClient = new WebDAVClientStub({
        createDirectoryResult: false,
        errorResponses: {
          '/test/dir': { 
            message: 'Conflict', 
            status: 409 
          }
        }
      });
      directoryService = new WebDAVDirectoryService(mockClient);
      
      // Setup spy after creating new service
      verboseSpy = spyOn(logger, 'verbose');
      
      const result = await directoryService.createDirectory('/test/dir');
      
      expect(result).toBe(true);
      expect(verboseSpy).toHaveBeenCalledWith(
        expect.stringContaining('Directory already exists'),
        logger.Verbosity.Normal
      );
      expect(directoryService.createdDirectories.has('/test/dir')).toBe(true);
    });
    
    it('should normalize directory paths before creating', async () => {
      const result = await directoryService.createDirectory('test\\dir');
      
      expect(result).toBe(true);
      expect(mockClient.calls.createDirectory).toContain('test/dir');
    });
  });
  
  describe('createDirectoryStructure', () => {
    it('should handle empty path', async () => {
      const result = await directoryService.createDirectoryStructure('');
      
      expect(result).toBe(true);
      expect(mockClient.calls.createDirectory.length).toBe(0);
    });
    
    it('should create a nested directory structure', async () => {
      const result = await directoryService.createDirectoryStructure('/test/nested/dir');
      
      expect(result).toBe(true);
      // Check that each segment was created (note: no leading slash in actual implementation)
      expect(mockClient.calls.createDirectory).toContain('test');
      expect(mockClient.calls.createDirectory).toContain('test/nested');
      expect(mockClient.calls.createDirectory).toContain('test/nested/dir');
      expect(successSpy).toHaveBeenCalledWith(
        expect.stringContaining('Directory structure prepared'),
        logger.Verbosity.Normal
      );
    });
    
    it('should handle leading and trailing slashes in path', async () => {
      const result = await directoryService.createDirectoryStructure('/test/dir/');
      
      expect(result).toBe(true);
      expect(mockClient.calls.createDirectory).toContain('test');
      expect(mockClient.calls.createDirectory).toContain('test/dir');
    });
    
    it('should log retry attempts when directory creation initially fails', async () => {
      // Create a special version of DirectoryService that we can fully control
      const errorSpy = spyOn(logger, 'verbose');
      const warningLogSpy = spyOn(logger, 'warning');
      
      // Replace createDirectory to simulate failures
      const originalCreateDir = directoryService.createDirectory;
      let attempt = 0;
      
      directoryService.createDirectory = async function(dirPath) {
        if (dirPath === 'test/retry') {
          attempt++;
          if (attempt < 2) {
            return false; // First attempt fails
          }
        }
        // Record the call even when simulating failure
        mockClient.calls.createDirectory.push(dirPath);
        return true; // Success on second attempt
      };
      
      // Mock setTimeout to avoid delays
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = (fn) => fn();
      
      const result = await directoryService.createDirectoryStructure('test/retry/path');
      
      // Restore the mocks
      global.setTimeout = originalSetTimeout;
      directoryService.createDirectory = originalCreateDir;
      
      expect(result).toBe(true);
      expect(attempt).toBe(2); // Should have tried twice
      expect(verboseSpy).toHaveBeenCalledWith(
        expect.stringContaining('Retry attempt'),
        expect.anything()
      );
    });
    
    it('should handle failure after all retry attempts', async () => {
      // Configure client to always fail for one specific directory
      mockClient.createDirectory = async (path) => {
        if (path === 'test/nested') {
          throw new Error('Failed to create nested directory');
        }
        mockClient.calls.createDirectory.push(path);
        return { status: 201 };
      };
      
      // Mock setTimeout to prevent actual delays
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = (fn) => fn();
      
      const result = await directoryService.createDirectoryStructure('/test/nested/dir');
      
      // Restore setTimeout
      global.setTimeout = originalSetTimeout;
      
      expect(result).toBe(true); // Should still return true to continue upload
      expect(mockClient.calls.createDirectory).toContain('test');
      expect(warningSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to create directory segment'),
        logger.Verbosity.Normal
      );
    });
    
    it('should handle unexpected errors during directory structure creation', async () => {
      // Mock an error that doesn't come from createDirectory
      mockClient = new WebDAVClientStub();
      directoryService = new WebDAVDirectoryService(mockClient);
      
      // Setup spy after creating new service
      warningSpy = spyOn(logger, 'warning');
      
      // Force an unexpected error
      const originalSplit = String.prototype.split;
      String.prototype.split = function() {
        throw new Error('Unexpected error');
      };
      
      const result = await directoryService.createDirectoryStructure('/test/dir');
      
      // Restore split
      String.prototype.split = originalSplit;
      
      expect(result).toBe(false);
      expect(warningSpy).toHaveBeenCalledWith(
        expect.stringContaining('Directory structure error'),
        logger.Verbosity.Normal
      );
    });
    
    it('should normalize paths in directory structure', async () => {
      const result = await directoryService.createDirectoryStructure('C:\\test\\windows\\path');
      
      expect(result).toBe(true);
      // In the actual implementation, the full path might be created at once
      // Check for individual segments or the full path
      const directories = mockClient.calls.createDirectory;
      const hasPath = directories.some(path => 
        path === 'C:/test' || 
        path === 'C:/test/windows' || 
        path === 'C:/test/windows/path'
      );
      expect(hasPath).toBe(true);
    });
  });
}); 