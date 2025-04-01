/**
 * Tests for WebDAV Service
 * 
 * To run these tests: bun test src/test/webdav-service.test.js
 */

import { expect, describe, it, beforeEach, spyOn } from 'bun:test';
import WebDAVService from '../core/webdav-service.js';
import * as commandRunner from '../utils/command-runner.js';
import * as logger from '../utils/logger.js';

describe('WebDAV Service', () => {
  // Set up spies before each test
  let runCommandSpy;
  let loggerVerboseSpy;
  let loggerSuccessSpy;
  let loggerErrorSpy;
  let loggerWarningSpy;
  
  beforeEach(() => {
    // Create fresh spies for each test
    runCommandSpy = spyOn(commandRunner, 'runCommand');
    loggerVerboseSpy = spyOn(logger, 'verbose');
    loggerSuccessSpy = spyOn(logger, 'success');
    loggerErrorSpy = spyOn(logger, 'error');
    loggerWarningSpy = spyOn(logger, 'warning');
  });
  
  // Test WebDAV service construction
  it('should create a WebDAV service with the provided URL', () => {
    const service = new WebDAVService('http://example.com', 1);
    
    expect(service.webdavUrl).toBe('http://example.com');
    expect(service.verbosity).toBe(1);
  });
  
  // Test connectivity check with success
  it('should return true when connectivity check succeeds', async () => {
    // Mock successful connection
    runCommandSpy.mockImplementation(() => Promise.resolve({
      stdout: '200',
      stderr: ''
    }));
    
    const service = new WebDAVService('http://example.com', 1);
    const result = await service.checkConnectivity();
    
    expect(result).toBe(true);
    expect(runCommandSpy).toHaveBeenCalled();
  });
  
  // Test connectivity check with failure
  it('should return false when connectivity check fails with 500+ status code', async () => {
    // Mock failed connection with server error
    runCommandSpy.mockImplementation(() => Promise.resolve({
      stdout: '503',
      stderr: ''
    }));
    
    const service = new WebDAVService('http://example.com', 1);
    const result = await service.checkConnectivity();
    
    expect(result).toBe(false);
  });
  
  // Test connectivity check with connection error
  it('should return false when connectivity check throws an error', async () => {
    // Mock connection error
    runCommandSpy.mockImplementation(() => Promise.reject(new Error('Connection timeout')));
    
    const service = new WebDAVService('http://example.com', 1);
    const result = await service.checkConnectivity();
    
    expect(result).toBe(false);
  });
  
  // Test directory creation
  it('should create a directory successfully', async () => {
    // Mock successful directory creation
    runCommandSpy.mockImplementation(() => Promise.resolve({
      stdout: '',
      stderr: ''
    }));
    
    const service = new WebDAVService('http://example.com', 1);
    const result = await service.createDirectory('test-dir', 'parent-dir');
    
    expect(result).toBe(true);
    expect(runCommandSpy).toHaveBeenCalled();
  });
  
  // Test directory creation failure
  it('should handle directory creation failure gracefully', async () => {
    // Mock failed directory creation
    runCommandSpy.mockImplementation(() => Promise.reject(new Error('Failed to create directory')));
    
    const service = new WebDAVService('http://example.com', 1);
    const result = await service.createDirectory('test-dir');
    
    // On error, we return false since the directory couldn't be created
    expect(result).toBe(false);
  });
  
  // Test successful file upload
  it('should upload a file successfully', async () => {
    // Need to reset previous mocks for this test
    runCommandSpy.mockReset();
    
    // Mock successful file upload
    runCommandSpy.mockImplementation((command) => {
      // Verify the command contains the expected parameters
      expect(command).toContain('-T "/local/path/file.txt"');
      expect(command).toContain('"http://example.com/remote/path/file.txt"');
      
      return Promise.resolve({
        stdout: 'Upload successful',
        stderr: ''
      });
    });
    
    const service = new WebDAVService('http://example.com', 1);
    const result = await service.uploadFile('/local/path/file.txt', 'remote/path/file.txt');
    
    expect(result.success).toBe(true);
    expect(result.output).toBe('Upload successful');
    expect(runCommandSpy).toHaveBeenCalled();
  });
  
  // Test file upload failure
  it('should handle file upload failures gracefully', async () => {
    // Mock failed file upload
    runCommandSpy.mockImplementation(() => Promise.reject(new Error('Upload failed')));
    
    const service = new WebDAVService('http://example.com', 1);
    const result = await service.uploadFile('/local/path/file.txt', 'remote/path/file.txt');
    
    expect(result.success).toBe(false);
    expect(result.output).toBe('Upload failed');
  });
  
  // Test file upload with custom timeout
  it('should use custom timeout when uploading a file', async () => {
    // Need to reset previous mocks for this test
    runCommandSpy.mockReset();
    
    // Mock successful file upload and check for timeout parameter
    runCommandSpy.mockImplementation((command) => {
      // Verify the command contains the expected timeout parameter
      expect(command).toContain('-m 120');
      
      return Promise.resolve({
        stdout: 'Upload successful',
        stderr: ''
      });
    });
    
    const service = new WebDAVService('http://example.com', 1);
    const result = await service.uploadFile('/local/path/file.txt', 'remote/path/file.txt', 120);
    
    expect(result.success).toBe(true);
  });
}); 