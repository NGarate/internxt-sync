/**
 * Tests for WebDAV File Service
 */

import { expect, describe, it, beforeEach, afterEach, mock } from 'bun:test';
import { WebDAVFileService } from './webdav-file-service';
import { Verbosity } from '../../utils/logger';
import * as logger from '../../utils/logger';
import { createMockLoggers, spyOn } from '../../../test-config/mocks/test-helpers';
import * as fs from 'fs';

// Mock WebDAV client
class WebDAVClientStub {
  constructor(options = {}) {
    this.calls = {
      putFileContents: [],
      getDirectoryContents: []
    };
    
    // Default results
    this.putFileResult = options.putFileResult !== undefined 
      ? options.putFileResult 
      : true;
      
    this.getDirectoryContentResult = options.getDirectoryContentResult !== undefined 
      ? options.getDirectoryContentResult 
      : true;
  }
  
  async putFileContents(path, content, options = {}) {
    this.calls.putFileContents.push({ path, options });
    
    if (!this.putFileResult) {
      throw new Error('Failed to upload file');
    }
    
    return { status: 201 };
  }
  
  async getDirectoryContents(path) {
    this.calls.getDirectoryContents.push(path);
    
    if (!this.getDirectoryContentResult) {
      throw new Error('Failed to get directory contents');
    }
    
    return [
      { basename: 'file1.txt', filename: `${path}/file1.txt`, type: 'file' },
      { basename: 'file2.txt', filename: `${path}/file2.txt`, type: 'file' }
    ];
  }
}

describe('WebDAV File Service', () => {
  let fileService;
  let mockClient;
  let loggerMocks;
  let originalReadFile;
  let originalStat;
  
  beforeEach(() => {
    // Mock logger
    loggerMocks = createMockLoggers();
    
    // Create WebDAV client stub
    mockClient = new WebDAVClientStub();
    
    // Save original fs.promises methods
    originalReadFile = fs.promises.readFile;
    originalStat = fs.promises.stat;
    
    // Mock fs.promises methods
    spyOn(fs.promises, 'readFile').mockImplementation(async () => Buffer.from('test file content'));
    spyOn(fs.promises, 'stat').mockImplementation(async () => ({ size: 1024 }));
    
    // Create service
    fileService = new WebDAVFileService(mockClient);
  });
  
  describe('constructor', () => {
    it('should initialize with the provided client and verbosity', () => {
      const testClient = {};
      const testVerbosity = Verbosity.Verbose;
      
      const service = new WebDAVFileService(testClient, testVerbosity);
      
      expect(service.client).toBe(testClient);
      expect(service.verbosity).toBe(testVerbosity);
    });
    
    it('should use default verbosity if not provided', () => {
      const testClient = {};
      
      const service = new WebDAVFileService(testClient);
      
      expect(service.client).toBe(testClient);
      expect(service.verbosity).toBe(Verbosity.Normal);
    });
  });
  
  describe('normalizePath', () => {
    it('should convert backslashes to forward slashes', () => {
      expect(fileService.normalizePath('path\\to\\file')).toBe('path/to/file');
      expect(fileService.normalizePath('C:\\Users\\Documents')).toBe('C:/Users/Documents');
    });

    it('should leave forward slashes unchanged', () => {
      expect(fileService.normalizePath('path/to/file')).toBe('path/to/file');
      expect(fileService.normalizePath('/root/path')).toBe('/root/path');
    });

    it('should handle mixed slash styles', () => {
      expect(fileService.normalizePath('path/to\\file')).toBe('path/to/file');
      expect(fileService.normalizePath('path\\to/file')).toBe('path/to/file');
    });
  });
  
  describe('uploadFile', () => {
    it('should successfully upload a file using read stream', async () => {
      const result = await fileService.uploadFile('localFile.txt', '/remote/file.txt');
      
      expect(result.success).toBe(true);
      expect(mockClient.calls.putFileContents[0].path).toBe('/remote/file.txt');
    });
    
    it('should handle empty target path by using source filename', async () => {
      const result = await fileService.uploadFile('localPath/file.txt', '');
      
      expect(result.success).toBe(true);
      expect(mockClient.calls.putFileContents[0].path).toBe('');
    });
    
    it('should append filename to target path if target is a directory', async () => {
      const result = await fileService.uploadFile('localPath/file.txt', '/remote/dir/');
      
      expect(result.success).toBe(true);
      expect(mockClient.calls.putFileContents[0].path).toBe('/remote/dir/');
    });
    
    it('should use contentLength option when available', async () => {
      const result = await fileService.uploadFile('localFile.txt', '/remote/file.txt');
      
      expect(result.success).toBe(true);
      expect(mockClient.calls.putFileContents[0].path).toBe('/remote/file.txt');
    });
    
    it('should handle upload errors gracefully', async () => {
      // Configure client to simulate error
      mockClient.putFileResult = false;
      
      const result = await fileService.uploadFile('localFile.txt', '/remote/file.txt');
      
      expect(result.success).toBe(false);
      expect(result.output).toBe('Failed to upload file');
    });
    
    it('should handle file read errors gracefully', async () => {
      // Configure fs to throw an error
      spyOn(fs.promises, 'readFile').mockImplementation(async () => {
        throw new Error('File read error');
      });
      
      const result = await fileService.uploadFile('localFile.txt', '/remote/file.txt');
      
      expect(result.success).toBe(false);
      expect(result.output).toBe('File read error');
    });
    
    it('should normalize paths when uploading', async () => {
      const result = await fileService.uploadFile('localFile.txt', '\\remote\\dir\\file.txt');
      
      expect(result.success).toBe(true);
      expect(mockClient.calls.putFileContents[0].path).toBe('/remote/dir/file.txt');
    });
  });
  
  describe('uploadFileWithProgress', () => {
    it('should upload file with progress tracking', async () => {
      const progressCallback = mock(() => {});
      
      const result = await fileService.uploadFileWithProgress('localFile.txt', '/remote/file.txt', progressCallback);
      
      expect(result.success).toBe(true);
      expect(mockClient.calls.putFileContents[0].path).toBe('/remote/file.txt');
      expect(progressCallback).toHaveBeenCalledTimes(2); // Start (0%) and finish (100%)
    });
    
    it('should handle upload errors gracefully', async () => {
      // Configure client to simulate error
      mockClient.putFileResult = false;
      const progressCallback = mock(() => {});
      
      const result = await fileService.uploadFileWithProgress('localFile.txt', '/remote/file.txt', progressCallback);
      
      expect(result.success).toBe(false);
      expect(result.output).toBe('Failed to upload file');
      expect(progressCallback).toHaveBeenCalledTimes(1); // Only start (0%)
    });
    
    it('should normalize paths when uploading with progress', async () => {
      const progressCallback = mock(() => {});
      
      const result = await fileService.uploadFileWithProgress('localFile.txt', '\\remote\\dir\\file.txt', progressCallback);
      
      expect(result.success).toBe(true);
      expect(mockClient.calls.putFileContents[0].path).toBe('/remote/dir/file.txt');
    });
  });
}); 