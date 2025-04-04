/**
 * Tests for WebDAV Service (Composed)
 */

import { expect, describe, it, beforeEach, mock, spyOn } from 'bun:test';
import WebDAVService from './webdav-service';
import * as logger from '../../utils/logger';
import { Verbosity } from '../../interfaces/logger';

// Mock services
class MockConnectivityService {
  constructor() {
    this.checkConnectivityResult = true;
  }
  
  async checkConnectivity() {
    return this.checkConnectivityResult;
  }
}

class MockDirectoryService {
  constructor() {
    this.createDirectoryResult = true;
    this.createDirectoryStructureResult = true;
    this.calls = {
      createDirectory: [],
      createDirectoryStructure: []
    };
  }
  
  async createDirectory(dirPath, targetPath) {
    this.calls.createDirectory.push({ dirPath, targetPath });
    return this.createDirectoryResult;
  }
  
  async createDirectoryStructure(path) {
    this.calls.createDirectoryStructure.push({ path });
    return this.createDirectoryStructureResult;
  }
}

class MockFileService {
  constructor() {
    this.uploadFileResult = true;
    this.calls = {
      uploadFile: []
    };
  }
  
  async uploadFile(sourceFilePath, targetFilePath) {
    this.calls.uploadFile.push({ sourceFilePath, targetFilePath });
    return this.uploadFileResult;
  }
}

describe('WebDAV Service (Composed)', () => {
  let webdavService;
  let mockConnectivityService;
  let mockDirectoryService;
  let mockFileService;
  let successSpy;
  let verboseSpy;
  let errorSpy;
  
  beforeEach(() => {
    mockConnectivityService = new MockConnectivityService();
    mockDirectoryService = new MockDirectoryService();
    mockFileService = new MockFileService();
    
    webdavService = new WebDAVService('https://example.com/webdav');
    webdavService.connectivityService = mockConnectivityService;
    webdavService.directoryService = mockDirectoryService;
    webdavService.fileService = mockFileService;
    
    // Create spies for logger functions
    successSpy = spyOn(logger, 'success');
    verboseSpy = spyOn(logger, 'verbose');
    errorSpy = spyOn(logger, 'error');
  });
  
  describe('constructor', () => {
    it('should initialize with the provided URL', () => {
      const service = new WebDAVService('https://test.com/webdav');
      
      expect(service.webdavUrl).toBe('https://test.com/webdav');
      expect(service.verbosity).toBe(Verbosity.Normal);
    });
    
    it('should initialize with the provided verbosity', () => {
      const service = new WebDAVService('https://test.com/webdav', Verbosity.Verbose);
      
      expect(service.webdavUrl).toBe('https://test.com/webdav');
      expect(service.verbosity).toBe(Verbosity.Verbose);
    });
  });
  
  describe('checkConnectivity', () => {
    it('should return true when connectivity check succeeds', async () => {
      mockConnectivityService.checkConnectivityResult = true;
      
      const result = await webdavService.checkConnectivity();
      
      expect(result).toBe(true);
    });
    
    it('should return false when connectivity check fails', async () => {
      mockConnectivityService.checkConnectivityResult = false;
      
      const result = await webdavService.checkConnectivity();
      
      expect(result).toBe(false);
    });
  });
  
  describe('createDirectory', () => {
    it('should forward call to directory service', async () => {
      const result = await webdavService.createDirectory('test-dir', '/target');
      
      expect(result).toBe(true);
      expect(mockDirectoryService.calls.createDirectory).toContainEqual({
        dirPath: 'test-dir',
        targetPath: '/target'
      });
    });
  });
  
  describe('createDirectoryStructure', () => {
    it('should forward call to directory service', async () => {
      const path = 'path/to/dir';
      const result = await webdavService.createDirectoryStructure(path);
      
      expect(result).toBe(true);
      expect(mockDirectoryService.calls.createDirectoryStructure).toContainEqual({
        path
      });
    });
  });
  
  describe('uploadFile', () => {
    it('should forward call to file service', async () => {
      const result = await webdavService.uploadFile('source.txt', 'target.txt');
      
      expect(result).toBe(true);
      expect(mockFileService.calls.uploadFile).toContainEqual({
        sourceFilePath: 'source.txt',
        targetFilePath: 'target.txt'
      });
    });
  });
}); 