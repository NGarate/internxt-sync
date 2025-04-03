import { Verbosity } from '../interfaces/logger.js';
/**
 * Tests for FileUploadManager
 */

import { expect, describe, it, beforeEach, afterEach, spyOn } from 'bun:test';
import { FileUploadManager } from '../core/upload/file-upload-manager.js';
import * as logger from '../utils/logger.js';

// Helper function to create mock functions (since Bun doesn't have jest.fn())
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
  
  // Add toHaveBeenCalledWith for compatibility
  Object.defineProperty(mock, 'called', {
    get: () => calls.length > 0
  });
  
  return mock;
}

describe('FileUploadManager', () => {
  let uploadManager;
  let mockUploadHandler;
  let loggerVerboseSpy;
  let loggerInfoSpy;
  let loggerErrorSpy;

  beforeEach(() => {
    // Create a mock upload handler
    mockUploadHandler = mockFn(() => Promise.resolve());
    
    // Spy on logger functions
    loggerVerboseSpy = spyOn(logger, 'verbose');
    loggerInfoSpy = spyOn(logger, 'info');
    loggerErrorSpy = spyOn(logger, 'error');
    
    // Create upload manager with the mock handler
    uploadManager = new FileUploadManager(
      3, // maxConcurrency
      mockUploadHandler,
      logger.Verbosity.Normal
    );
  });
  
  afterEach(() => {
    // Clean up any intervals
    if (uploadManager && uploadManager.checkCompletionInterval) {
      clearInterval(uploadManager.checkCompletionInterval);
    }
  });
  
  describe('constructor', () => {
    it('should initialize with the provided parameters', () => {
      expect(uploadManager.maxConcurrency).toBe(3);
      expect(uploadManager.uploadHandler).toBe(mockUploadHandler);
      expect(uploadManager.verbosity).toBe(logger.Verbosity.Normal);
      expect(uploadManager.activeUploads.size).toBe(0);
      expect(uploadManager.pendingFiles.length).toBe(0);
      expect(uploadManager.completionCallback).toBe(null);
    });
  });
  
  describe('setQueue', () => {
    it('should set the queue of files to upload', () => {
      const files = [
        { relativePath: 'file1.txt' },
        { relativePath: 'file2.txt' }
      ];
      
      uploadManager.setQueue(files);
      
      expect(uploadManager.pendingFiles.length).toBe(2);
      expect(uploadManager.pendingFiles[0]).toEqual(files[0]);
      expect(uploadManager.pendingFiles[1]).toEqual(files[1]);
    });
  });
  
  describe('start', () => {
    it('should start uploading files with the specified concurrency', () => {
      // Setup files
      const files = [
        { relativePath: 'file1.txt' },
        { relativePath: 'file2.txt' },
        { relativePath: 'file3.txt' },
        { relativePath: 'file4.txt' },
        { relativePath: 'file5.txt' }
      ];
      
      uploadManager.setQueue(files);
      
      // Mock processNextFile to count calls
      const originalProcessNextFile = uploadManager.processNextFile;
      let processNextFileCalls = 0;
      uploadManager.processNextFile = () => {
        processNextFileCalls++;
      };
      
      uploadManager.start();
      
      // Verify that processNextFile was called for the initial batch
      // (based on concurrency)
      expect(processNextFileCalls).toBe(3);
      
      // Restore method
      uploadManager.processNextFile = originalProcessNextFile;
    });
    
    it('should set up completion callback', () => {
      const completionCallback = () => {};
      
      uploadManager.start(completionCallback);
      
      expect(uploadManager.completionCallback).toBe(completionCallback);
      expect(uploadManager.checkCompletionInterval).toBeDefined();
    });
  });
  
  describe('processNextFile', () => {
    it('should process and upload files from the queue', async () => {
      // Setup files
      const files = [
        { relativePath: 'file1.txt' },
        { relativePath: 'file2.txt' }
      ];
      
      uploadManager.setQueue(files);
      
      // Process first file
      uploadManager.processNextFile();
      
      // Verify active upload was tracked
      expect(uploadManager.activeUploads.size).toBe(1);
      expect(uploadManager.pendingFiles.length).toBe(1);
      
      // Verify upload handler was called with first file
      expect(mockUploadHandler.called).toBe(true);
      
      // Wait for upload to complete
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Verify upload was removed from active uploads
      expect(uploadManager.activeUploads.size).toBe(0);
    });
    
    it('should handle upload errors gracefully', async () => {
      // Setup files
      const files = [
        { relativePath: 'file1.txt' }
      ];
      
      // Mock upload handler to reject
      mockUploadHandler.mockImplementation(() => Promise.reject(new Error('Upload failed')));
      
      uploadManager.setQueue(files);
      
      // Process file
      uploadManager.processNextFile();
      
      // Wait for error to be handled
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Verify error was logged
      expect(loggerErrorSpy).toHaveBeenCalled();
      
      // Verify upload was removed from active uploads
      expect(uploadManager.activeUploads.size).toBe(0);
    });
  });
  
  describe('cancelAll', () => {
    it('should cancel all pending uploads', () => {
      // Setup files
      const files = [
        { relativePath: 'file1.txt' },
        { relativePath: 'file2.txt' }
      ];
      
      uploadManager.setQueue(files);
      
      // Set up completion interval with a mock
      let intervalCleared = false;
      const originalClearInterval = global.clearInterval;
      global.clearInterval = () => {
        intervalCleared = true;
      };
      
      // Set interval manually to avoid using the actual timer
      uploadManager.checkCompletionInterval = {};
      
      // Cancel uploads
      uploadManager.cancelAll();
      
      // Restore clearInterval
      global.clearInterval = originalClearInterval;
      
      // Verify pending files were cleared
      expect(uploadManager.pendingFiles.length).toBe(0);
      
      // Verify interval was cleared by checking our flag
      expect(intervalCleared).toBe(true);
    });
  });
  
  describe('helper methods', () => {
    it('should return pendingCount correctly', () => {
      uploadManager.pendingFiles = [{ relativePath: 'file1.txt' }];
      expect(uploadManager.pendingCount).toBe(1);
    });
    
    it('should return activeCount correctly', () => {
      uploadManager.activeUploads = new Set(['id1', 'id2']);
      expect(uploadManager.activeCount).toBe(2);
    });
    
    it('should report isIdle correctly when idle', () => {
      uploadManager.pendingFiles = [];
      uploadManager.activeUploads = new Set();
      expect(uploadManager.isIdle).toBe(true);
    });
    
    it('should report isIdle correctly when not idle', () => {
      uploadManager.pendingFiles = [{ relativePath: 'file1.txt' }];
      expect(uploadManager.isIdle).toBe(false);
      
      uploadManager.pendingFiles = [];
      uploadManager.activeUploads = new Set(['id1']);
      expect(uploadManager.isIdle).toBe(false);
    });
  });
}); 