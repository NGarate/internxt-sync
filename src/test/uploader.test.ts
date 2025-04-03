import { FileInfo, ScanResult, UploadState } from '../interfaces/file-scanner.js';
import { Verbosity } from '../interfaces/logger.js';
import { WebDAVConnectivityOptions, WebDAVServiceOptions, WebDAVClientOptions, UploadResult, DirectoryResult } from '../interfaces/webdav.js';
/**
 * Tests for Uploader
 * 
 * To run these tests: bun test src/test/uploader.test.js
 */

import { expect, describe, it, beforeEach, afterEach, mock, spyOn } from 'bun:test';
import Uploader from '../core/upload/uploader.js';
import WebDAVService from '../core/webdav/webdav-service.js';
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

describe('Uploader', () => {
  let uploader;
  let mockWebDAVService;
  let mockHashCache;
  let mockProgressTracker;
  let mockUploadManager;
  let mockFileScanner;
  
  beforeEach(() => {
    // Create mock services
    mockWebDAVService = {
      checkConnectivity: mock(() => Promise.resolve(true)),
      createDirectoryStructure: mock(() => Promise.resolve(true)),
      uploadFile: mock(() => Promise.resolve({ success: true }))
    };
    
    mockHashCache = {
      load: mock(() => Promise.resolve()),
      hasChanged: mock(() => Promise.resolve(true)),
      updateHash: mock(() => Promise.resolve())
    };
    
    mockProgressTracker = {
      initialize: mock(),
      recordSuccess: mock(),
      recordFailure: mock(),
      startProgressUpdates: mock(),
      stopProgressUpdates: mock(),
      displaySummary: mock()
    };
    
    mockUploadManager = {
      setQueue: mock(),
      start: mock((callback) => { 
        if (callback) setTimeout(() => callback(), 0); 
        return Promise.resolve();
      })
    };

    mockFileScanner = {
      updateFileState: mock(),
      recordCompletion: mock(),
      saveState: mock(() => Promise.resolve())
    };
    
    // Create uploader instance
    uploader = new Uploader('https://webdav.example.com', 3, 'remote/dir', Verbosity.Normal);
    
    // Manually replace the internal components with mocks
    uploader.webdavService = mockWebDAVService;
    uploader.hashCache = mockHashCache;
    uploader.progressTracker = mockProgressTracker;
    uploader.uploadManager = mockUploadManager;
  });
  
  describe('constructor', () => {
    it('should initialize with the provided parameters', () => {
      // Create a new instance to test constructor only
      const freshUploader = new Uploader('https://webdav.example.com', 3, 'remote/dir', Verbosity.Normal);
      
      expect(freshUploader.webdavUrl).toBe('https://webdav.example.com');
      expect(freshUploader.targetDir).toBe('remote/dir');
      expect(freshUploader.verbosity).toBe(Verbosity.Normal);
      
      // Verify services are initialized (just check that they exist, not specific instances)
      expect(freshUploader.webdavService instanceof WebDAVService).toBe(true);
      expect(freshUploader.hashCache instanceof HashCache).toBe(true);
      expect(freshUploader.progressTracker instanceof ProgressTracker).toBe(true);
      expect(freshUploader.uploadManager instanceof FileUploadManager).toBe(true);
    });
    
    it('should clean up target directory path', () => {
      uploader = new Uploader('https://webdav.example.com', 3, '///remote/dir///', Verbosity.Normal);
      expect(uploader.targetDir).toBe('remote/dir');
    });
    
    it('should load hash cache on construction', () => {
      // We can verify this by checking the real HashCache implementation
      const hashCacheSpy = spyOn(HashCache.prototype, 'load');
      
      // Create a new instance to trigger constructor
      uploader = new Uploader('https://webdav.example.com', 3, 'remote/dir', Verbosity.Normal);
      
      // Verify load was called
      expect(hashCacheSpy).toHaveBeenCalled();
    });
  });
  
  describe('setFileScanner', () => {
    it('should set the file scanner and log a message', () => {
      const verboseSpy = spyOn(logger, 'verbose');
      uploader.setFileScanner(mockFileScanner);
      
      expect(uploader.fileScanner).toBe(mockFileScanner);
      expect(verboseSpy).toHaveBeenCalled();
    });
  });
  
  describe('handleFileUpload', () => {
    it('should upload a file that has changed', async () => {
      // Create a test file object
      const fileInfo = { 
        absolutePath: '/path/to/file.txt',
        relativePath: 'file.txt', 
        size: 1024, 
        lastModified: new Date(),
        checksum: 'test-checksum'
      };
      
      // Call the method
      const result = await uploader.handleFileUpload(fileInfo);
      
      // Check if the file was processed correctly
      expect(result.success).toBe(true);
    });
    
    it('should skip upload for unchanged files', async () => {
      // Create a test file object marked as unchanged
      const fileInfo = { 
        absolutePath: '/path/to/file.txt',
        relativePath: 'file.txt', 
        size: 1024, 
        lastModified: new Date(),
        checksum: 'test-checksum',
        hasChanged: false  // Set hasChanged to false directly
      };
      
      // Reset the upload mock to ensure clean state
      mockWebDAVService.uploadFile = mock(() => Promise.resolve({ success: true }));
      
      // Call the method
      const result = await uploader.handleFileUpload(fileInfo);
      
      // Verify the file was skipped but still recorded as success
      expect(mockWebDAVService.uploadFile.mock.calls.length).toBe(0);
      expect(result.success).toBe(true);
    });
    
    it('should update file scanner after successful upload', async () => {
      // Setup file and file scanner
      const fileInfo = {
        absolutePath: '/path/to/file.txt',
        relativePath: 'file.txt',
        checksum: 'abc123'
      };
      
      uploader.fileScanner = mockFileScanner;
      
      // Call the method
      await uploader.handleFileUpload(fileInfo);
      
      // Verify file scanner was updated
      expect(mockFileScanner.updateFileState.mock.calls.length).toBeGreaterThan(0);
    });
    
    it('should handle upload failures', async () => {
      // Setup file
      const fileInfo = {
        absolutePath: '/path/to/file.txt',
        relativePath: 'file.txt'
      };
      
      // Mock failed upload
      mockWebDAVService.uploadFile = mock(() => 
        Promise.resolve({ success: false, output: 'Upload failed' })
      );
      
      const errorSpy = spyOn(logger, 'error');
      
      const result = await uploader.handleFileUpload(fileInfo);
      
      // Verify failure was recorded
      expect(mockProgressTracker.recordFailure.mock.calls.length).toBeGreaterThan(0);
      expect(errorSpy).toHaveBeenCalled();
      expect(result.success).toBe(false);
    });
    
    it('should handle exceptions during upload', async () => {
      const fileInfo = { 
        absolutePath: '/path/to/file.txt',
        relativePath: 'file.txt', 
        size: 1024, 
        lastModified: new Date(),
        checksum: 'test-checksum'
      };
      
      // Mock error during upload
      mockWebDAVService.uploadFile = mock(() => {
        throw new Error('Test error');
      });
      
      // Spy on error logger
      const errorSpy = spyOn(logger, 'error');
      
      const result = await uploader.handleFileUpload(fileInfo);
      
      // Verify error was handled
      expect(errorSpy).toHaveBeenCalled();
      expect(mockProgressTracker.recordFailure.mock.calls.length).toBeGreaterThan(0);
      expect(result.success).toBe(false);
    });
    
    it('should handle Windows-style paths correctly', async () => {
      // Setup file with Windows path
      const fileInfo = {
        absolutePath: 'C:\\path\\to\\file.txt',
        relativePath: 'parent\\child\\file.txt',
        checksum: 'test-checksum'
      };
      
      // Mock create directory structure and upload
      mockWebDAVService.createDirectoryStructure = mock((path) => {
        // Store the path so we can verify it later
        mockWebDAVService.lastDirPath = path;
        return Promise.resolve(true);
      });
      
      mockWebDAVService.uploadFile = mock((srcPath, targetPath) => {
        // Store the target path so we can verify it later
        mockWebDAVService.lastTargetPath = targetPath;
        return Promise.resolve({ success: true });
      });
      
      const result = await uploader.handleFileUpload(fileInfo);
      
      // Verify directory was created with normalized path
      expect(mockWebDAVService.lastDirPath).toContain('parent/child');
      
      // Verify file was uploaded with normalized path
      expect(mockWebDAVService.lastTargetPath).toContain('parent/child/file.txt');
      
      expect(result.success).toBe(true);
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
      expect(mockWebDAVService.checkConnectivity.mock.calls.length).toBeGreaterThan(0);
      expect(mockWebDAVService.createDirectoryStructure.mock.calls.length).toBeGreaterThan(0);
      expect(mockProgressTracker.initialize.mock.calls.length).toBeGreaterThan(0);
      expect(mockProgressTracker.startProgressUpdates.mock.calls.length).toBeGreaterThan(0);
      expect(mockUploadManager.setQueue.mock.calls.length).toBeGreaterThan(0);
      expect(mockUploadManager.start.mock.calls.length).toBeGreaterThan(0);
      expect(mockProgressTracker.displaySummary.mock.calls.length).toBeGreaterThan(0);
      expect(mockProgressTracker.stopProgressUpdates.mock.calls.length).toBeGreaterThan(0);
    });
    
    it('should return early if webdavUrl is not available', async () => {
      // Create uploader with no webdavUrl
      uploader.webdavUrl = '';
      
      const errorSpy = spyOn(logger, 'error');
      
      await uploader.startUpload([]);
      
      // Verify early return
      expect(errorSpy).toHaveBeenCalled();
      expect(mockWebDAVService.checkConnectivity.mock.calls.length).toBe(0);
    });
    
    it('should return early if connectivity check fails', async () => {
      mockWebDAVService.checkConnectivity = mock(() => Promise.resolve(false));
      
      await uploader.startUpload([{ relativePath: 'file.txt', absolutePath: '/path/to/file.txt' }]);
      
      // Verify early return
      expect(mockUploadManager.setQueue.mock.calls.length).toBe(0);
    });
    
    it('should handle empty file list', async () => {
      const successSpy = spyOn(logger, 'success');
      
      await uploader.startUpload([]);
      
      // Should show success message
      expect(successSpy).toHaveBeenCalled();
    });
    
    it('should update file scanner on completion', async () => {
      uploader.fileScanner = mockFileScanner;
      
      await uploader.startUpload([{ relativePath: 'file.txt', absolutePath: '/path/to/file.txt' }]);
      
      expect(mockFileScanner.recordCompletion.mock.calls.length).toBeGreaterThan(0);
      expect(mockFileScanner.saveState.mock.calls.length).toBeGreaterThan(0);
    });
    
    it('should handle exceptions during upload process', async () => {
      mockUploadManager.start = mock(() => {
        throw new Error('Test error');
      });
      
      uploader.fileScanner = mockFileScanner;
      
      const errorSpy = spyOn(logger, 'error');
      
      await uploader.startUpload([{ relativePath: 'file.txt', absolutePath: '/path/to/file.txt' }]);
      
      // Verify error handling
      expect(errorSpy).toHaveBeenCalled();
      expect(mockFileScanner.saveState.mock.calls.length).toBeGreaterThan(0);
      expect(mockProgressTracker.stopProgressUpdates.mock.calls.length).toBeGreaterThan(0);
    });
  });
}); 