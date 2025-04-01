/**
 * Tests for Command Runner
 * 
 * To run these tests: bun test src/test/command-runner.test.js
 */

import { expect, describe, it, beforeEach, afterEach } from 'bun:test';
import * as commandRunner from '../utils/command-runner.js';
import * as childProcess from 'child_process';
import * as logger from '../utils/logger.js';
import { spyOn, createMockProcess } from './test-utils.js';
import { mockPromiseResult, mockPromiseRejection } from './test-helpers.js';

describe('Command Runner', () => {
  let loggerVerboseSpy;
  let spawnSpy;
  
  beforeEach(() => {
    // Mock logger
    loggerVerboseSpy = spyOn(logger, 'verbose');
    
    // Create spy for spawn
    spawnSpy = spyOn(childProcess, 'spawn');
  });
  
  afterEach(() => {
    // Clean up
    if (spawnSpy) spawnSpy.mockRestore();
    if (loggerVerboseSpy) loggerVerboseSpy.mockRestore();
  });
  
  // Test createInteractiveProcess
  describe('createInteractiveProcess', () => {
    // Add a simple passing test to verify the function exists
    it('should be a function', () => {
      expect(typeof commandRunner.createInteractiveProcess).toBe('function');
    });
    
    // Note: More thorough testing of createInteractiveProcess is done in uploader.test.js
    // where it's used in a real-world scenario with curl for file uploads
  });
  
  // Test createInteractiveProcessWithFallback
  describe('createInteractiveProcessWithFallback', () => {
    it('should be a function', () => {
      expect(typeof commandRunner.createInteractiveProcessWithFallback).toBe('function');
    });
    
    it('should use the primary process when it succeeds', () => {
      const mockProc = createMockProcess();
      spawnSpy.mockImplementation(() => mockProc);
      
      const primaryArgs = ['arg1', 'arg2'];
      const fallbackArgs = ['fallback1', 'fallback2'];
      
      const result = commandRunner.createInteractiveProcessWithFallback(
        'primary-cmd', primaryArgs, 
        'fallback-cmd', fallbackArgs, 
        {}, 1
      );
      
      // Check that result has expected properties
      expect(result).toBeDefined();
      expect(result.stdin).toBeDefined();
      expect(result.stdout).toBeDefined();
      expect(result.stderr).toBeDefined();
      
      expect(spawnSpy).toHaveBeenCalledWith('primary-cmd', primaryArgs, 
        expect.objectContaining({ stdio: ["pipe", "pipe", "pipe"] }));
    });
    
    it('should use the fallback process when the primary fails', () => {
      const mockProc = createMockProcess();
      let callCount = 0;
      
      spawnSpy.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          throw new Error('Primary failed');
        }
        return mockProc;
      });
      
      const primaryArgs = ['arg1', 'arg2'];
      const fallbackArgs = ['fallback1', 'fallback2'];
      
      const result = commandRunner.createInteractiveProcessWithFallback(
        'primary-cmd', primaryArgs, 
        'fallback-cmd', fallbackArgs, 
        {}, 1
      );
      
      // Check that result has expected properties
      expect(result).toBeDefined();
      expect(result.stdin).toBeDefined();
      expect(result.stdout).toBeDefined();
      expect(result.stderr).toBeDefined();
      
      expect(spawnSpy).toHaveBeenCalledWith('primary-cmd', primaryArgs, 
        expect.objectContaining({ stdio: ["pipe", "pipe", "pipe"] }));
      expect(spawnSpy).toHaveBeenCalledWith('fallback-cmd', fallbackArgs, 
        expect.objectContaining({ stdio: ["pipe", "pipe", "pipe"] }));
    });
  });
}); 