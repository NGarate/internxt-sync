import { Verbosity } from '../interfaces/logger.js';
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

describe('Command Runner', () => {
  let loggerVerboseSpy;
  let spawnSpy;
  
  beforeEach(() => {
    // Mock logger
    loggerVerboseSpy = spyOn(logger, 'verbose');
    
    // Create spy for spawn
    spawnSpy = spyOn(childProcess, 'spawn');
    
    // Reset the cached commands
    global.lastSuccessfulCommand = null;
    global.lastSuccessfulArgs = null;
  });
  
  afterEach(() => {
    // Clean up
    if (spawnSpy) spawnSpy.mockRestore();
    if (loggerVerboseSpy) loggerVerboseSpy.mockRestore();
  });
  
  // Test createInteractiveProcess
  describe('createInteractiveProcess', () => {
    it('should be a function', () => {
      expect(typeof commandRunner.createInteractiveProcess).toBe('function');
    });
    
    it('should spawn a new process with the provided command and args', () => {
      // Create a mock process for spawn to return
      const mockProc = createMockProcess();
      spawnSpy.mockReturnValue(mockProc);
      
      const result = commandRunner.createInteractiveProcess('test-cmd', ['arg1', 'arg2']);
      
      // Check that spawn was called with the correct arguments
      expect(spawnSpy).toHaveBeenCalled();
      expect(spawnSpy.mock.calls[0][0]).toBe('test-cmd');
      expect(spawnSpy.mock.calls[0][1]).toEqual(['arg1', 'arg2']);
      
      // Check the result is our mock process
      expect(result).toBe(mockProc);
    });
  });
  
  // Test createInteractiveProcessWithFallback
  describe('createInteractiveProcessWithFallback', () => {
    it('should be a function', () => {
      expect(typeof commandRunner.createInteractiveProcessWithFallback).toBe('function');
    });
    
    it('should use the primary process when it succeeds', () => {
      // Create a mock process for spawn to return
      const mockProc = createMockProcess();
      
      // Mock spawn to return our mock process
      spawnSpy.mockReturnValue(mockProc);
      
      // Call the function with test parameters
      const result = commandRunner.createInteractiveProcessWithFallback(
        'primary-cmd', ['arg1'], 
        'fallback-cmd', ['arg2'], 
        {}, 1
      );
      
      // Verify that spawn was called at least once
      expect(spawnSpy).toHaveBeenCalled();
      
      // Check the result is a process-like object
      expect(result).toBeDefined();
      expect(result.stdin).toBeDefined();
      expect(result.stdout).toBeDefined();
      expect(result.stderr).toBeDefined();
    });
  });
}); 