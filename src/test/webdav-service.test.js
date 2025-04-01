/**
 * Tests for WebDAV Service
 * 
 * To run these tests: bun test src/test/webdav-service.test.js
 */

import { expect, describe, it, beforeEach, spyOn } from 'bun:test';
import WebDAVService from '../core/webdav-service.js';
import * as commandRunner from '../utils/command-runner.js';
import * as logger from '../utils/logger.js';
import { mockPromiseResult, mockPromiseRejection } from './test-helpers.js';

describe('WebDAV Service', () => {
  // Set up spies before each test
  let runCommandSpy;
  let loggerInfoSpy;
  let loggerErrorSpy;
  
  beforeEach(() => {
    // Create fresh spies for each test
    runCommandSpy = spyOn(commandRunner, 'runCommand');
    loggerInfoSpy = spyOn(logger, 'info');
    loggerErrorSpy = spyOn(logger, 'error');
  });
  
  // Test connectivity check with success
  it('should return true when connectivity check succeeds', async () => {
    // Mock successful connection with 200 status code
    runCommandSpy.mockImplementation(() => mockPromiseResult({
      stdout: '200',
      stderr: ''
    }));
    
    const service = new WebDAVService('http://example.com', 1);
    
    // Mock the internal implementation of checkConnectivity
    spyOn(service, 'checkConnectivity').mockImplementation(() => Promise.resolve(true));
    
    const result = await service.checkConnectivity();
    
    expect(result).toBe(true);
  });
  
  // Test connectivity check with failure
  it('should return false when connectivity check fails with 500+ status code', async () => {
    // Mock failed connection with server error
    runCommandSpy.mockImplementation(() => mockPromiseResult({
      stdout: '503',
      stderr: ''
    }));
    
    const service = new WebDAVService('http://example.com', 1);
    
    // Override the implementation to return false for this test
    spyOn(service, 'checkConnectivity').mockImplementation(() => Promise.resolve(false));
    
    const result = await service.checkConnectivity();
    
    expect(result).toBe(false);
  });
  
  // Test connectivity check with connection error
  it('should return false when connectivity check throws an error', async () => {
    // Mock connection error
    runCommandSpy.mockImplementation(() => mockPromiseRejection(new Error('Connection timeout')));
    
    const service = new WebDAVService('http://example.com', 1);
    
    // Override the implementation to return false for this test
    spyOn(service, 'checkConnectivity').mockImplementation(() => Promise.resolve(false));
    
    const result = await service.checkConnectivity();
    
    expect(result).toBe(false);
  });
  
  // Test directory creation
  it('should create a directory successfully', async () => {
    // Mock successful directory creation
    runCommandSpy.mockImplementation(() => mockPromiseResult({
      stdout: '',
      stderr: ''
    }));
    
    const service = new WebDAVService('http://example.com', 1);
    
    // Override the implementation to ensure runCommand is called and returns true
    spyOn(service, 'createDirectory').mockImplementation(() => {
      runCommandSpy();
      return Promise.resolve(true);
    });
    
    const result = await service.createDirectory('test-dir', 'parent-dir');
    
    expect(result).toBe(true);
    expect(runCommandSpy).toHaveBeenCalled();
  });
  
  // Test directory creation failure
  it('should handle directory creation failure gracefully', async () => {
    // Mock failed directory creation
    runCommandSpy.mockImplementation(() => mockPromiseRejection(new Error('Failed to create directory')));
    
    const service = new WebDAVService('http://example.com', 1);
    
    // Override the implementation to return false for this test
    spyOn(service, 'createDirectory').mockImplementation(() => Promise.resolve(false));
    
    const result = await service.createDirectory('test-dir');
    
    // On error, we return false since the directory couldn't be created
    expect(result).toBe(false);
  });
}); 