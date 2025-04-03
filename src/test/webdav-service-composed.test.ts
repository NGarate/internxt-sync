import { WebDAVConnectivityOptions, WebDAVServiceOptions, WebDAVClientOptions, UploadResult, DirectoryResult } from '../interfaces/webdav.js';
/**
 * Tests for Main WebDAV Service (Composed)
 */

import { expect, describe, it, beforeEach, spyOn } from 'bun:test';
import WebDAVService from '../core/webdav/webdav-service.js';

// Helper function to create a mock function
function mockFn(implementation) {
  const fn = () => {
    fn.calls++;
    fn.called = true;
    return implementation ? implementation() : undefined;
  };
  fn.calls = 0;
  fn.called = false;
  fn.mockImplementation = (newImpl) => {
    implementation = newImpl;
    return fn;
  };
  fn.mockReset = () => {
    fn.calls = 0;
    fn.called = false;
  };
  fn.toHaveBeenCalledTimes = (n) => fn.calls === n;
  return fn;
}

describe('WebDAV Service (Composed)', () => {
  let webdavService;
  let mockDirectoryService;
  let mockFileService;
  let mockConnectivityService;
  
  beforeEach(() => {
    // Create mock services
    mockDirectoryService = {
      createDirectory: mockFn(() => Promise.resolve(true)),
      createDirectoryStructure: mockFn(() => Promise.resolve(true))
    };
    
    mockFileService = {
      uploadFile: mockFn(() => Promise.resolve({ success: true, output: 'Success' })),
      getDirectoryContents: mockFn(() => Promise.resolve([]))
    };
    
    mockConnectivityService = {
      checkConnectivity: mockFn(() => Promise.resolve(true))
    };
    
    // Create a WebDAV service
    webdavService = new WebDAVService('http://example.com');
    
    // Replace the internal services with our mocks
    webdavService.directoryService = mockDirectoryService;
    webdavService.fileService = mockFileService;
    webdavService.connectivityService = mockConnectivityService;
  });
  
  describe('createDirectory', () => {
    it('should delegate to directoryService.createDirectory with no target', async () => {
      const result = await webdavService.createDirectory('test-dir');
      
      expect(result).toBe(true);
      expect(mockDirectoryService.createDirectory.called).toBe(true);
    });
    
    it('should delegate to directoryService.createDirectory with target', async () => {
      const result = await webdavService.createDirectory('test-dir', 'parent-dir');
      
      expect(result).toBe(true);
      expect(mockDirectoryService.createDirectory.called).toBe(true);
    });
  });
  
  describe('createDirectoryStructure', () => {
    it('should delegate to directoryService.createDirectoryStructure', async () => {
      const result = await webdavService.createDirectoryStructure('parent/child/grandchild');
      
      expect(result).toBe(true);
      expect(mockDirectoryService.createDirectoryStructure.called).toBe(true);
    });
  });
  
  describe('checkConnectivity', () => {
    it('should delegate to connectivityService.checkConnectivity', async () => {
      const result = await webdavService.checkConnectivity();
      
      expect(result).toBe(true);
      expect(mockConnectivityService.checkConnectivity.called).toBe(true);
    });
  });
  
  describe('uploadFile', () => {
    it('should delegate to fileService.uploadFile with default timeout', async () => {
      const result = await webdavService.uploadFile('/path/to/file.txt', 'remote/path.txt');
      
      expect(result.success).toBe(true);
      expect(mockFileService.uploadFile.called).toBe(true);
    });
    
    it('should delegate to fileService.uploadFile with custom timeout', async () => {
      const result = await webdavService.uploadFile('/path/to/file.txt', 'remote/path.txt', 120);
      
      expect(result.success).toBe(true);
      expect(mockFileService.uploadFile.called).toBe(true);
    });
  });
}); 