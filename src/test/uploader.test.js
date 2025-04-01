/**
 * Tests for Uploader
 * 
 * To run these tests: bun test src/test/uploader.test.js
 */

import { expect, describe, it, beforeEach, afterEach, spyOn } from 'bun:test';
import Uploader from '../core/uploader.js';
import WebDAVService from '../core/webdav-service.js';
import * as logger from '../utils/logger.js';
import * as commandRunner from '../utils/command-runner.js';
import { EventEmitter } from 'events';
import { Readable } from 'stream';

describe('Uploader', () => {
  // Set up spies and mocks
  let webdavCreateDirectorySpy;
  let webdavCreateDirectoryStructureSpy;
  let webdavCheckConnectivitySpy;
  let createInteractiveProcessSpy;
  let loggerInfoSpy;
  let loggerVerboseSpy;
  let loggerSuccessSpy;
  let loggerErrorSpy;
  let loggerAlwaysSpy;
  let processMock;
  let fileScannerMock;
  
  // Helper function to create a mock for interactive process
  function createMockProcess() {
    const stdin = new EventEmitter();
    stdin.write = () => true;
    stdin.end = () => {};
    
    const stdout = new Readable();
    stdout._read = () => {};
    
    const stderr = new Readable();
    stderr._read = () => {};
    
    const proc = new EventEmitter();
    proc.stdin = stdin;
    proc.stdout = stdout;
    proc.stderr = stderr;
    
    return proc;
  }
  
  beforeEach(() => {
    // Create the mock process
    processMock = createMockProcess();
    
    // Spy on WebDAV service methods
    webdavCreateDirectorySpy = spyOn(WebDAVService.prototype, 'createDirectory').mockImplementation(() => Promise.resolve(true));
    webdavCreateDirectoryStructureSpy = spyOn(WebDAVService.prototype, 'createDirectoryStructure').mockImplementation(() => Promise.resolve(true));
    webdavCheckConnectivitySpy = spyOn(WebDAVService.prototype, 'checkConnectivity').mockImplementation(() => Promise.resolve(true));
    
    // Mock the file scanner
    fileScannerMock = {
      updateFileState: (path, checksum) => {},
      recordCompletion: () => {},
      saveState: () => Promise.resolve()
    };
    
    // Spy on file scanner methods
    spyOn(fileScannerMock, 'updateFileState');
    spyOn(fileScannerMock, 'recordCompletion');
    spyOn(fileScannerMock, 'saveState');
    
    // Spy on logger functions
    loggerInfoSpy = spyOn(logger, 'info');
    loggerVerboseSpy = spyOn(logger, 'verbose');
    loggerSuccessSpy = spyOn(logger, 'success');
    loggerErrorSpy = spyOn(logger, 'error');
    loggerAlwaysSpy = spyOn(logger, 'always');
    
    // Spy on command runner
    createInteractiveProcessSpy = spyOn(commandRunner, 'createInteractiveProcess').mockImplementation(() => processMock);
    
    // Mock console.log and process.stdout.write to avoid progress bar output during tests
    spyOn(console, 'log').mockImplementation(() => {});
    spyOn(process.stdout, 'write').mockImplementation(() => {});
  });
  
  // No need for afterEach - Bun's test framework will handle cleanup
  
  // Test Uploader construction
  it('should create an Uploader with the provided parameters', () => {
    const uploader = new Uploader('http://example.com', 4, 'test-dir', 2);
    
    expect(uploader.webdavUrl).toBe('http://example.com');
    expect(uploader.concurrentUploads).toBe(4);
    expect(uploader.targetDir).toBe('test-dir');
    expect(uploader.verbosity).toBe(2);
    expect(uploader.activeUploads.size).toBe(0);
    expect(uploader.pendingFiles.length).toBe(0);
    expect(uploader.completedFiles).toBe(0);
    expect(uploader.failedFiles).toBe(0);
    expect(uploader.totalFiles).toBe(0);
    expect(uploader.webdavService).toBeInstanceOf(WebDAVService);
  });
  
  // Test setting file scanner
  it('should set the file scanner', () => {
    const uploader = new Uploader('http://example.com', 4);
    uploader.setFileScanner(fileScannerMock);
    
    expect(uploader.fileScanner).toBe(fileScannerMock);
  });
  
  // Test uploadFile method - success case
  it('should upload a file successfully', async () => {
    const uploader = new Uploader('http://example.com', 4);
    uploader.setFileScanner(fileScannerMock);
    
    const fileInfo = {
      relativePath: 'test/file.txt',
      absolutePath: '/path/to/test/file.txt',
      size: 1024,
      checksum: 'test-checksum'
    };
    
    // Setup the mock process to emit success
    setTimeout(() => {
      processMock.emit('close', 0);
    }, 10);
    
    const result = await uploader.uploadFile(fileInfo);
    
    // Verify the result
    expect(result.success).toBe(true);
    expect(result.filePath).toBe('test/file.txt');
    
    // Check that directory was created
    expect(webdavCreateDirectorySpy).toHaveBeenCalledWith('test', '');
    
    // Check that file scanner was updated
    expect(fileScannerMock.updateFileState).toHaveBeenCalledWith('test/file.txt', 'test-checksum');
    
    // Verify that the process was started with correct parameters
    expect(createInteractiveProcessSpy).toHaveBeenCalledWith(
      'curl',
      expect.arrayContaining([
        '--insecure',
        '-m', expect.any(String),
        '-T', '/path/to/test/file.txt',
        expect.stringContaining('http://example.com/')
      ]),
      expect.any(Object),
      expect.any(Number)
    );
  });
  
  // Test uploadFile method - failure case
  it('should handle file upload failure', async () => {
    const uploader = new Uploader('http://example.com', 4);
    
    const fileInfo = {
      relativePath: 'test/file.txt',
      absolutePath: '/path/to/test/file.txt',
      size: 1024,
      checksum: 'test-checksum'
    };
    
    // Setup the mock process to emit failure
    setTimeout(() => {
      processMock.stderr.push('Upload failed: connection error');
      processMock.emit('close', 1);
    }, 10);
    
    const result = await uploader.uploadFile(fileInfo);
    
    // Verify the result
    expect(result.success).toBe(false);
    expect(result.filePath).toBe('test/file.txt');
    expect(uploader.failedFiles).toBe(1);
    
    // Check error was logged
    expect(loggerErrorSpy).toHaveBeenCalled();
  });
  
  // Test startUpload method
  it('should start uploading files with the specified concurrency', async () => {
    const uploader = new Uploader('http://example.com', 2);
    uploader.setFileScanner(fileScannerMock);
    
    // Override uploadFile to simulate successful uploads without async issues
    spyOn(uploader, 'uploadFile').mockImplementation((fileInfo) => {
      uploader.completedFiles++;
      uploader.activeUploads.delete(fileInfo.relativePath);
      uploader.processNextFile();
      return Promise.resolve({ success: true, filePath: fileInfo.relativePath });
    });
    
    // Override processNextFile to prevent it from using the actual method
    spyOn(uploader, 'processNextFile').mockImplementation(function() {
      if (uploader.pendingFiles.length > 0 && uploader.activeUploads.size < uploader.concurrentUploads) {
        const fileInfo = uploader.pendingFiles.shift();
        uploader.activeUploads.add(fileInfo.relativePath);
        uploader.uploadFile(fileInfo);
      }
    });
    
    const filesToUpload = [
      { relativePath: 'file1.txt', absolutePath: '/path/to/file1.txt', size: 1024, checksum: 'checksum1' },
      { relativePath: 'file2.txt', absolutePath: '/path/to/file2.txt', size: 1024, checksum: 'checksum2' },
      { relativePath: 'file3.txt', absolutePath: '/path/to/file3.txt', size: 1024, checksum: 'checksum3' }
    ];
    
    // Mock updateProgressBar to prevent it from actually updating the progress bar
    spyOn(uploader, 'updateProgressBar');
    
    // Start the upload
    await uploader.startUpload(filesToUpload);
    
    // Force clear any interval that might be running
    if (uploader.progressUpdateInterval) {
      clearInterval(uploader.progressUpdateInterval);
    }
    
    // Verify the final state
    expect(uploader.completedFiles).toBe(3);
    expect(uploader.failedFiles).toBe(0);
    expect(uploader.totalFiles).toBe(3);
    expect(uploader.pendingFiles.length).toBe(0);
    
    // Check that file scanner was updated and state saved
    expect(fileScannerMock.recordCompletion).toHaveBeenCalled();
    expect(fileScannerMock.saveState).toHaveBeenCalled();
    
    // Check that success message was printed
    expect(loggerAlwaysSpy).toHaveBeenCalled();
  });
  
  // Test WebDAV connectivity check failures
  it('should abort upload if WebDAV connectivity check fails', async () => {
    // Set connectivity check to fail
    webdavCheckConnectivitySpy.mockImplementation(() => Promise.resolve(false));
    
    const uploader = new Uploader('http://example.com', 2);
    
    // Mock uploadFile to verify it's not called
    const uploadFileSpy = spyOn(uploader, 'uploadFile');
    
    const filesToUpload = [
      { relativePath: 'file1.txt', absolutePath: '/path/to/file1.txt', size: 1024, checksum: 'checksum1' }
    ];
    
    await uploader.startUpload(filesToUpload);
    
    // Should not have started any uploads
    expect(uploadFileSpy).not.toHaveBeenCalled();
    expect(uploader.completedFiles).toBe(0);
    expect(uploader.totalFiles).toBe(0);
  });
  
  // Test handling of target directory
  it('should ensure target directory exists before upload', async () => {
    const uploader = new Uploader('http://example.com', 2, 'target/dir');
    
    // Override uploadFile to simulate successful uploads
    spyOn(uploader, 'uploadFile').mockImplementation((fileInfo) => {
      uploader.completedFiles++;
      uploader.activeUploads.delete(fileInfo.relativePath);
      uploader.processNextFile();
      return Promise.resolve({ success: true, filePath: fileInfo.relativePath });
    });
    
    // Override processNextFile to avoid actual processing
    spyOn(uploader, 'processNextFile');
    
    const filesToUpload = [
      { relativePath: 'file1.txt', absolutePath: '/path/to/file1.txt', size: 1024, checksum: 'checksum1' }
    ];
    
    // Start the upload
    await uploader.startUpload(filesToUpload);
    
    // Check that the target directory structure was created
    expect(webdavCreateDirectoryStructureSpy).toHaveBeenCalledWith('target/dir');
  });
}); 