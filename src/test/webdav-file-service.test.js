/**
 * Tests for WebDAV File Service
 */

import { expect, describe, it, beforeEach, afterEach, spyOn } from 'bun:test';
import { WebDAVFileService } from '../core/webdav/webdav-file-service.js';
import * as logger from '../utils/logger.js';
import * as fs from 'fs';
import path from 'path';
import os from 'os';

describe('WebDAV File Service', () => {
  let fileService;
  let mockClient;
  let consoleOutput = '';
  let tempFilePath = '';
  const originalConsoleLog = console.log;
  
  // Setup before each test
  beforeEach(() => {
    // Reset console output capture
    consoleOutput = '';
    console.log = (...args) => {
      consoleOutput += args.join(' ') + '\n';
      return originalConsoleLog(...args);
    };
    
    // Create a temp file for testing
    tempFilePath = path.join(os.tmpdir(), `test-file-${Date.now()}.txt`);
    
    // Create mock client with methods that return promises
    mockClient = {
      putFileContents: async (path, content) => ({ success: true }),
      getDirectoryContents: async (path) => ([
        { basename: 'file1.txt', filename: '/path/to/file1.txt', type: 'file' },
        { basename: 'file2.txt', filename: '/path/to/file2.txt', type: 'file' }
      ])
    };
    
    // Create file service with the mock client
    fileService = new WebDAVFileService(mockClient, logger.Verbosity.Normal);
  });
  
  afterEach(() => {
    // Clean up temp file if it exists
    try {
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    } catch (error) {
      // Ignore cleanup errors
    }
    
    // Restore console.log
    console.log = originalConsoleLog;
  });
  
  describe('constructor', () => {
    it('should initialize with the provided client and verbosity', () => {
      const testClient = {};
      const testVerbosity = logger.Verbosity.Verbose;
      
      const service = new WebDAVFileService(testClient, testVerbosity);
      
      expect(service.client).toBe(testClient);
      expect(service.verbosity).toBe(testVerbosity);
    });
    
    it('should use default verbosity if not provided', () => {
      const testClient = {};
      
      const service = new WebDAVFileService(testClient);
      
      expect(service.client).toBe(testClient);
      expect(service.verbosity).toBe(logger.Verbosity.Normal);
    });
  });
  
  describe('normalizePath', () => {
    it('should convert backslashes to forward slashes', () => {
      expect(fileService.normalizePath('path\\to\\file.txt')).toBe('path/to/file.txt');
      expect(fileService.normalizePath('C:\\Users\\Documents')).toBe('C:/Users/Documents');
    });

    it('should leave forward slashes unchanged', () => {
      expect(fileService.normalizePath('path/to/file.txt')).toBe('path/to/file.txt');
      expect(fileService.normalizePath('/root/path')).toBe('/root/path');
    });

    it('should handle mixed slash styles', () => {
      expect(fileService.normalizePath('path/to\\file.txt')).toBe('path/to/file.txt');
      expect(fileService.normalizePath('path\\to/file.txt')).toBe('path/to/file.txt');
    });
    
    it('should log verbose output when normalizing paths', () => {
      const verboseSpy = spyOn(logger, 'verbose');
      fileService.normalizePath('path\\to\\file.txt');
      expect(verboseSpy).toHaveBeenCalled();
    });
  });
  
  describe('uploadFile', () => {
    it('should upload a file successfully', async () => {
      // Create a real test file
      fs.writeFileSync(tempFilePath, 'test content');
      
      // Spy on client's putFileContents
      const putFileSpy = spyOn(mockClient, 'putFileContents');
      const successSpy = spyOn(logger, 'success');
      
      const result = await fileService.uploadFile(tempFilePath, '/remote/path/file.txt');
      
      expect(result.success).toBe(true);
      expect(putFileSpy).toHaveBeenCalledWith('/remote/path/file.txt', expect.any(Buffer));
      expect(successSpy).toHaveBeenCalled();
    });
    
    it('should handle file read errors', async () => {
      const nonExistentFile = '/path/to/nonexistent/file.txt';
      const errorSpy = spyOn(logger, 'error');
      
      const result = await fileService.uploadFile(nonExistentFile, '/remote/path/file.txt');
      
      expect(result.success).toBe(false);
      expect(result.output).toContain('No such file or directory');
      expect(errorSpy).toHaveBeenCalled();
    });
    
    it('should handle upload errors', async () => {
      // Create a real test file
      fs.writeFileSync(tempFilePath, 'test content');
      
      // Mock client to throw an error
      mockClient.putFileContents = async () => {
        throw new Error('Upload failed');
      };
      
      const errorSpy = spyOn(logger, 'error');
      
      const result = await fileService.uploadFile(tempFilePath, '/remote/path/file.txt');
      
      expect(result.success).toBe(false);
      expect(result.output).toBe('Upload failed');
      expect(errorSpy).toHaveBeenCalled();
    });
    
    it('should normalize the target path before uploading', async () => {
      // Create a real test file
      fs.writeFileSync(tempFilePath, 'test content');
      
      // Spy on normalizePath
      const normalizeSpy = spyOn(fileService, 'normalizePath');
      
      await fileService.uploadFile(tempFilePath, 'remote\\path\\file.txt');
      
      expect(normalizeSpy).toHaveBeenCalledWith('remote\\path\\file.txt');
    });
    
    it('should respect the default timeout parameter', async () => {
      // Create a real test file
      fs.writeFileSync(tempFilePath, 'test content');
      
      const result = await fileService.uploadFile(tempFilePath, '/remote/path/file.txt');
      
      // We're testing that the default parameter doesn't cause issues
      expect(result.success).toBe(true);
    });
    
    it('should accept a custom timeout parameter', async () => {
      // Create a real test file
      fs.writeFileSync(tempFilePath, 'test content');
      
      const result = await fileService.uploadFile(tempFilePath, '/remote/path/file.txt', 120);
      
      // We're testing that a custom timeout parameter doesn't cause issues
      expect(result.success).toBe(true);
    });
  });
  
  describe('getDirectoryContents', () => {
    it('should get directory contents successfully', async () => {
      const getContentsSpy = spyOn(mockClient, 'getDirectoryContents');
      
      const result = await fileService.getDirectoryContents('/some/directory');
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      expect(getContentsSpy).toHaveBeenCalledWith('/some/directory');
    });
    
    it('should use root path by default', async () => {
      const getContentsSpy = spyOn(mockClient, 'getDirectoryContents');
      
      await fileService.getDirectoryContents();
      
      expect(getContentsSpy).toHaveBeenCalledWith('/');
    });
    
    it('should normalize the directory path', async () => {
      const normalizeSpy = spyOn(fileService, 'normalizePath');
      const getContentsSpy = spyOn(mockClient, 'getDirectoryContents');
      
      await fileService.getDirectoryContents('some\\directory');
      
      expect(normalizeSpy).toHaveBeenCalledWith('some\\directory');
      expect(getContentsSpy).toHaveBeenCalledWith('some/directory');
    });
    
    it('should handle directory listing errors', async () => {
      // Mock client to throw an error
      mockClient.getDirectoryContents = async () => {
        throw new Error('Directory listing error');
      };
      
      const errorSpy = spyOn(logger, 'error');
      
      const result = await fileService.getDirectoryContents('/some/directory');
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
      expect(errorSpy).toHaveBeenCalled();
    });
    
    it('should return empty array for non-existent directories', async () => {
      // Mock client to throw a 404 error
      mockClient.getDirectoryContents = async () => {
        const error = new Error('Not Found');
        error.status = 404;
        throw error;
      };
      
      const result = await fileService.getDirectoryContents('/nonexistent');
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });
}); 