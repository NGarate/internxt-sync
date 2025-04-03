/**
 * Tests for Uploader
 * 
 * To run these tests: bun test src/test/uploader.test.js
 */

import { expect, describe, it, beforeEach, afterEach, spyOn } from 'bun:test';
import Uploader from '../core/upload/uploader.js';
import WebDAVService from '../core/webdav-service.js';
import { HashCache } from '../core/upload/hash-cache.js';
import { ProgressTracker } from '../core/upload/progress-tracker.js';
import { FileUploadManager } from '../core/upload/file-upload-manager.js';
import * as logger from '../utils/logger.js';
import * as commandRunner from '../utils/command-runner.js';
import { EventEmitter } from 'events';
import { Readable } from 'stream';
import * as fs from 'fs';
import * as crypto from 'crypto';
import os from 'os';
import path from 'path';

// Helper function to create mock functions
function mockFn(implementation) {
  const calls = [];
  const mock = function(...args) {
    calls.push(args);
    return implementation ? implementation(...args) : undefined;
  };
  
  mock.calls = calls;
  mock.mockImplementation = (newImpl) => {
    implementation = newImpl;
    return mock;
  };
  mock.mockReset = () => {
    calls.length = 0;
    return mock;
  };
  
  // Add compatibility properties
  Object.defineProperty(mock, 'called', {
    get: () => calls.length > 0
  });
  
  return mock;
}

describe('Uploader', () => {
  let uploader;
  let mockWebDAVService;
  let mockHashCache;
  let mockProgressTracker;
  let mockUploadManager;
  let mockFileScanner;
  let loggerVerboseSpy;
  let loggerSuccessSpy;
  let loggerErrorSpy;
  
  beforeEach(() => {
    // Create mock services
    mockWebDAVService = {
      checkConnectivity: mockFn(() => Promise.resolve(true)),
      createDirectoryStructure: mockFn(() => Promise.resolve(true)),
      uploadFile: mockFn(() => Promise.resolve({ success: true }))
    };
    
    mockHashCache = {
      load: mockFn(() => Promise.resolve()),
      hasChanged: mockFn(() => Promise.resolve(true)),
      updateHash: mockFn(() => Promise.resolve())
    };
    
    mockProgressTracker = {
      initialize: mockFn(),
      recordSuccess: mockFn(),
      recordFailure: mockFn(),
      startProgressUpdates: mockFn(),
      stopProgressUpdates: mockFn(),
      displaySummary: mockFn()
    };
    
    mockUploadManager = {
      setQueue: mockFn(),
      start: mockFn((callback) => { if (callback) callback(); })
    };

    mockFileScanner = {
      updateFileState: mockFn(),
      recordCompletion: mockFn(),
      saveState: mockFn(() => Promise.resolve())
    };
    
    // Spy on logger functions
    loggerVerboseSpy = spyOn(logger, 'verbose');
    loggerSuccessSpy = spyOn(logger, 'success');
    loggerErrorSpy = spyOn(logger, 'error');
    
    // Create uploader instance
    uploader = new Uploader('https://webdav.example.com', 3, 'remote/dir', logger.Verbosity.Normal);
    
    // Manually replace the internal components with mocks
    uploader.webdavService = mockWebDAVService;
    uploader.hashCache = mockHashCache;
    uploader.progressTracker = mockProgressTracker;
    uploader.uploadManager = mockUploadManager;
  });
  
  describe('constructor', () => {
    it('should initialize with the provided parameters', () => {
      // Create a new instance to test constructor only
      const freshUploader = new Uploader('https://webdav.example.com', 3, 'remote/dir', logger.Verbosity.Normal);
      
      expect(freshUploader.webdavUrl).toBe('https://webdav.example.com');
      expect(freshUploader.targetDir).toBe('remote/dir');
      expect(freshUploader.verbosity).toBe(logger.Verbosity.Normal);
      
      // Verify services are initialized (just check that they exist, not specific instances)
      expect(freshUploader.webdavService instanceof WebDAVService).toBe(true);
      expect(freshUploader.hashCache instanceof HashCache).toBe(true);
      expect(freshUploader.progressTracker instanceof ProgressTracker).toBe(true);
      expect(freshUploader.uploadManager instanceof FileUploadManager).toBe(true);
    });
    
    it('should clean up target directory path', () => {
      uploader = new Uploader('https://webdav.example.com', 3, '///remote/dir///', logger.Verbosity.Normal);
      expect(uploader.targetDir).toBe('remote/dir');
    });
    
    it('should load hash cache on construction', () => {
      // We can verify this by checking the real HashCache implementation
      const hashCacheSpy = spyOn(HashCache.prototype, 'load');
      
      // Create a new instance to trigger constructor
      uploader = new Uploader('https://webdav.example.com', 3, 'remote/dir', logger.Verbosity.Normal);
      
      // Verify load was called
      expect(hashCacheSpy).toHaveBeenCalled();
    });
  });
  
  describe('setFileScanner', () => {
    it('should set the file scanner and log a message', () => {
      uploader.setFileScanner(mockFileScanner);
      
      expect(uploader.fileScanner).toBe(mockFileScanner);
      expect(loggerVerboseSpy).toHaveBeenCalled();
    });
  });
  
  describe('handleFileUpload', () => {
    it('should upload a file that has changed', async () => {
      // Setup file that has changed
      const fileInfo = {
        absolutePath: '/path/to/file.txt',
        relativePath: 'file.txt',
        checksum: 'abc123'
      };
      
      // Ensure hasChanged returns true
      mockHashCache.hasChanged.mockImplementation(() => Promise.resolve(true));
      
      const result = await uploader.handleFileUpload(fileInfo);
      
      // Verify file was checked
      expect(mockHashCache.hasChanged.called).toBe(true);
      
      // Verify file was uploaded with correct parameters
      expect(mockWebDAVService.uploadFile.called).toBe(true);
      
      // Verify success was recorded
      expect(mockProgressTracker.recordSuccess.called).toBe(true);
      
      // Verify result
      expect(result).toEqual({ 
        success: true, 
        filePath: fileInfo.relativePath 
      });
    });
    
    it('should skip upload for unchanged files', async () => {
      // Setup file that has not changed
      const fileInfo = {
        absolutePath: '/path/to/file.txt',
        relativePath: 'file.txt'
      };
      
      // Ensure hasChanged returns false
      mockHashCache.hasChanged.mockImplementation(() => Promise.resolve(false));
      
      const result = await uploader.handleFileUpload(fileInfo);
      
      // Verify file was checked
      expect(mockHashCache.hasChanged.called).toBe(true);
      
      // Verify file was not uploaded
      expect(mockWebDAVService.uploadFile.called).toBe(false);
      
      // Verify success was still recorded (skipped files count as success)
      expect(mockProgressTracker.recordSuccess.called).toBe(true);
      
      // Verify result
      expect(result).toEqual({ 
        success: true, 
        filePath: fileInfo.relativePath 
      });
    });
    
    it('should update file scanner after successful upload', async () => {
      // Setup file and file scanner
      const fileInfo = {
        absolutePath: '/path/to/file.txt',
        relativePath: 'file.txt',
        checksum: 'abc123'
      };
      
      uploader.fileScanner = mockFileScanner;
      
      // Ensure file has changed
      mockHashCache.hasChanged.mockImplementation(() => Promise.resolve(true));
      
      // Mock successful upload
      mockWebDAVService.uploadFile.mockImplementation(() => 
        Promise.resolve({ success: true })
      );
      
      await uploader.handleFileUpload(fileInfo);
      
      // Verify file scanner was updated
      expect(mockFileScanner.updateFileState.called).toBe(true);
    });
    
    it('should handle upload failures', async () => {
      // Setup file
      const fileInfo = {
        absolutePath: '/path/to/file.txt',
        relativePath: 'file.txt'
      };
      
      // Ensure file has changed
      mockHashCache.hasChanged.mockImplementation(() => Promise.resolve(true));
      
      // Mock failed upload
      mockWebDAVService.uploadFile.mockImplementation(() => 
        Promise.resolve({ success: false, output: 'Upload failed' })
      );
      
      const result = await uploader.handleFileUpload(fileInfo);
      
      // Verify failure was recorded
      expect(mockProgressTracker.recordFailure.called).toBe(true);
      expect(loggerErrorSpy).toHaveBeenCalled();
      
      // Verify result
      expect(result).toEqual({ 
        success: false, 
        filePath: fileInfo.relativePath 
      });
    });
    
    it('should handle exceptions during upload', async () => {
      // Setup file
      const fileInfo = {
        absolutePath: '/path/to/file.txt',
        relativePath: 'file.txt'
      };
      
      // Mock an error during upload
      mockHashCache.hasChanged.mockImplementation(() => {
        throw new Error('Test error');
      });
      
      const result = await uploader.handleFileUpload(fileInfo);
      
      // Verify error was handled
      expect(loggerErrorSpy).toHaveBeenCalled();
      expect(mockProgressTracker.recordFailure.called).toBe(true);
      
      // Verify result
      expect(result).toEqual({ 
        success: false, 
        filePath: fileInfo.relativePath 
      });
    });
    
    it('should handle Windows-style paths correctly', async () => {
      // Setup mocks for file hash check and directory creation
      spyOn(uploader.hashCache, 'hasChanged').mockImplementation(() => Promise.resolve(true));
      spyOn(uploader.webdavService, 'createDirectoryStructure').mockImplementation(() => Promise.resolve(true));
      
      // Get the target directory value that the uploader will use
      const targetDir = uploader.targetDir;
      const expectedPath = targetDir ? `${targetDir}/parent/child/file.txt` : 'parent/child/file.txt';
      
      // Create a spy to verify that normalized paths are used
      const uploadSpy = spyOn(uploader.webdavService, 'uploadFile').mockImplementation(
        (absolutePath, targetPath) => {
          expect(targetPath).toBe(expectedPath);
          return Promise.resolve({ success: true });
        }
      );
      
      const fileInfo = {
        absolutePath: 'C:\\path\\to\\file.txt',
        relativePath: 'parent\\child\\file.txt',
        checksum: 'test-checksum'
      };
      
      const result = await uploader.handleFileUpload(fileInfo);
      
      expect(result.success).toBe(true);
      expect(uploadSpy).toHaveBeenCalled();
      
      // Verify directory creation was called with correct path
      const expectedDirPath = targetDir ? `${targetDir}/parent/child` : 'parent/child';
      expect(uploader.webdavService.createDirectoryStructure).toHaveBeenCalledWith(expectedDirPath);
    });
  });
  
  describe('startUpload', () => {
    it('should handle the upload process flow', async () => {
      // Setup files
      const filesToUpload = [
        { relativePath: 'file1.txt', absolutePath: '/path/to/file1.txt' },
        { relativePath: 'file2.txt', absolutePath: '/path/to/file2.txt' }
      ];
      
      await uploader.startUpload(filesToUpload);
      
      // Verify sequence of operations
      expect(mockWebDAVService.checkConnectivity.called).toBe(true);
      expect(mockWebDAVService.createDirectoryStructure.called).toBe(true);
      expect(mockProgressTracker.initialize.called).toBe(true);
      expect(mockProgressTracker.startProgressUpdates.called).toBe(true);
      expect(mockUploadManager.setQueue.called).toBe(true);
      expect(mockUploadManager.start.called).toBe(true);
      expect(mockProgressTracker.displaySummary.called).toBe(true);
      expect(mockProgressTracker.stopProgressUpdates.called).toBe(true);
    });
    
    it('should return early if webdavUrl is not available', async () => {
      // Create uploader with no webdavUrl
      uploader.webdavUrl = '';
      
      await uploader.startUpload([]);
      
      // Verify early return
      expect(loggerErrorSpy).toHaveBeenCalled();
      expect(mockWebDAVService.checkConnectivity.called).toBe(false);
    });
    
    it('should return early if connectivity check fails', async () => {
      mockWebDAVService.checkConnectivity.mockImplementation(() => Promise.resolve(false));
      
      await uploader.startUpload([{ relativePath: 'file.txt' }]);
      
      // Verify early return
      expect(mockUploadManager.setQueue.called).toBe(false);
    });
    
    it('should handle empty file list', async () => {
      await uploader.startUpload([]);
      
      // Should show success message
      expect(loggerSuccessSpy).toHaveBeenCalled();
    });
    
    it('should update file scanner on completion', async () => {
      uploader.fileScanner = mockFileScanner;
      
      await uploader.startUpload([{ relativePath: 'file.txt' }]);
      
      expect(mockFileScanner.recordCompletion.called).toBe(true);
      expect(mockFileScanner.saveState.called).toBe(true);
    });
    
    it('should handle exceptions during upload process', async () => {
      mockUploadManager.start.mockImplementation(() => {
        throw new Error('Test error');
      });
      
      uploader.fileScanner = mockFileScanner;
      
      await uploader.startUpload([{ relativePath: 'file.txt' }]);
      
      // Verify error handling
      expect(loggerErrorSpy).toHaveBeenCalled();
      expect(mockFileScanner.saveState.called).toBe(true);
      expect(mockProgressTracker.stopProgressUpdates.called).toBe(true);
    });
  });
}); 