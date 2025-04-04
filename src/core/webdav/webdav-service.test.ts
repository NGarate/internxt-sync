/**
 * Tests for WebDAV Service
 */

import { expect, describe, it, beforeEach, mock, spyOn } from 'bun:test';
import WebDAVService from './webdav-service';
import { mockPromiseResult, mockPromiseRejection } from '../../../test-config/mocks/promise-mock';
import { Verbosity } from '../../interfaces/logger';

describe('WebDAV Service Tests', () => {
  // Test variables
  const webdavUrl = 'https://example.com/webdav';
  
  // Mocks
  let mockClient: any;
  let mockConnectivityService: any;
  let mockDirectoryService: any;
  let mockFileService: any;
  
  beforeEach(() => {
    // Reset all mocks for each test
    mockClient = {
      exists: mock(() => Promise.resolve(true)),
      createDirectory: mock(() => Promise.resolve()),
      getDirectoryContents: mock(() => Promise.resolve([])),
      putFileContents: mock(() => Promise.resolve()),
    };
    
    // Set up connectivity service mock
    mockConnectivityService = {
      checkConnectivity: mock(() => Promise.resolve(true)),
    };
    
    // Set up directory service mock
    mockDirectoryService = {
      createDirectory: mock(() => Promise.resolve(true)),
      createDirectoryStructure: mock(() => Promise.resolve(true)),
    };
    
    // Set up file service mock
    mockFileService = {
      uploadFile: mock(() => Promise.resolve(true)),
      getDirectoryContents: mock(() => Promise.resolve([])),
    };
  });
  
  it('should create a WebDAV service with the provided URL', () => {
    const service = new WebDAVService(webdavUrl);
    
    expect(service.webdavUrl).toBe(webdavUrl);
    expect(service.verbosity).toBe(Verbosity.Normal); // Default verbosity
  });
  
  it('should return true when connectivity check succeeds', async () => {
    const service = new WebDAVService(webdavUrl);
    
    // Inject mock connectivity service
    service.connectivityService = mockConnectivityService;
    mockConnectivityService.checkConnectivity.mockImplementation(() => mockPromiseResult(true));
    
    const result = await service.checkConnectivity();
    
    expect(result).toBe(true);
    expect(mockConnectivityService.checkConnectivity).toHaveBeenCalled();
  });
  
  it('should return false when connectivity check fails', async () => {
    const service = new WebDAVService(webdavUrl);
    
    // Inject mock connectivity service
    service.connectivityService = mockConnectivityService;
    mockConnectivityService.checkConnectivity.mockImplementation(() => mockPromiseResult(false));
    
    const result = await service.checkConnectivity();
    
    expect(result).toBe(false);
    expect(mockConnectivityService.checkConnectivity).toHaveBeenCalled();
  });
  
  it('should create a directory successfully', async () => {
    const service = new WebDAVService(webdavUrl);
    
    // Inject mock directory service
    service.directoryService = mockDirectoryService;
    mockDirectoryService.createDirectory.mockImplementation(() => mockPromiseResult(true));
    
    const result = await service.createDirectory('/test/dir');
    
    expect(result).toBe(true);
    expect(mockDirectoryService.createDirectory).toHaveBeenCalledWith('/test/dir', '');
  });
  
  it('should create a directory with target path', async () => {
    const service = new WebDAVService(webdavUrl);
    const targetPath = '/custom/target';
    
    // Inject mock directory service
    service.directoryService = mockDirectoryService;
    mockDirectoryService.createDirectory.mockImplementation(() => mockPromiseResult(true));
    
    const result = await service.createDirectory('/test/dir', targetPath);
    
    expect(result).toBe(true);
    expect(mockDirectoryService.createDirectory).toHaveBeenCalledWith('/test/dir', targetPath);
  });
  
  it('should handle directory creation failure gracefully', async () => {
    const service = new WebDAVService(webdavUrl);
    
    // Inject mock directory service
    service.directoryService = mockDirectoryService;
    mockDirectoryService.createDirectory.mockImplementation(() => {
      throw new Error('Creation failed');
    });
    
    const result = await service.createDirectory('/test/dir');
    
    expect(result).toBe(false);
  });
  
  it('should create a nested directory structure successfully', async () => {
    const service = new WebDAVService(webdavUrl);
    
    // Inject mock directory service
    service.directoryService = mockDirectoryService;
    mockDirectoryService.createDirectoryStructure.mockImplementation(() => mockPromiseResult(true));
    
    const result = await service.createDirectoryStructure('/test/nested/dir');
    
    expect(result).toBe(true);
    expect(mockDirectoryService.createDirectoryStructure).toHaveBeenCalledWith('/test/nested/dir');
  });
  
  it('should handle empty path when creating directory structure', async () => {
    const service = new WebDAVService(webdavUrl);
    
    // Inject mock directory service
    service.directoryService = mockDirectoryService;
    
    const result = await service.createDirectoryStructure('');
    
    expect(result).toBe(true);
    // Empty paths should still be passed to the service for handling
    expect(mockDirectoryService.createDirectoryStructure).toHaveBeenCalledWith('');
  });
  
  it('should handle directory structure creation failure gracefully', async () => {
    const service = new WebDAVService(webdavUrl);
    
    // Inject mock directory service
    service.directoryService = mockDirectoryService;
    mockDirectoryService.createDirectoryStructure.mockImplementation(() => {
      throw new Error('Creation failed');
    });
    
    const result = await service.createDirectoryStructure('/test/nested/dir');
    
    expect(result).toBe(false);
  });
});

describe('WebDAV Service File Upload Tests', () => {
  // Test variables
  const webdavUrl = 'https://example.com/webdav';
  const filePath = '/local/path/file.txt';
  const remotePath = '/remote/path/file.txt';
  
  // Mocks
  let mockFileService: any;
  
  beforeEach(() => {
    // Set up file service mock
    mockFileService = {
      uploadFile: mock(() => Promise.resolve(true)),
    };
  });
  
  it('should upload a file successfully', async () => {
    const service = new WebDAVService(webdavUrl);
    
    // Inject mock file service
    service.fileService = mockFileService;
    mockFileService.uploadFile.mockImplementation(() => mockPromiseResult(true));
    
    const result = await service.uploadFile(filePath, remotePath);
    
    expect(result).toBe(true);
    expect(mockFileService.uploadFile).toHaveBeenCalledWith(filePath, remotePath, 60);
  });
  
  it('should handle file read error during upload', async () => {
    const service = new WebDAVService(webdavUrl);
    
    // Inject mock file service
    service.fileService = mockFileService;
    mockFileService.uploadFile.mockImplementation(() => {
      throw new Error('File not found');
    });
    
    const result = await service.uploadFile(filePath, remotePath);
    
    expect(result).toBe(false);
  });
  
  it('should handle server error during upload', async () => {
    const service = new WebDAVService(webdavUrl);
    
    // Inject mock file service
    service.fileService = mockFileService;
    mockFileService.uploadFile.mockImplementation(() => {
      throw new Error('Server error');
    });
    
    const result = await service.uploadFile(filePath, remotePath);
    
    expect(result).toBe(false);
  });
}); 