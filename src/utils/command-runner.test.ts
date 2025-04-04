/**
 * Tests for Command Runner
 */

import { expect, describe, it, beforeEach, afterEach, mock, spyOn } from 'bun:test';
import * as commandRunner from './command-runner';
import * as childProcess from 'child_process';
import * as logger from './logger';
import { Verbosity } from '../interfaces/logger';
import { mockLoggerFunctions } from '../../test-config/bun-test-helpers';

// Create a mock process for testing
function createMockProcess() {
  // Create mock event emitters for stdin, stdout, stderr
  const createMockEventEmitter = () => {
    const emitter = {
      _events: {},
      _eventsCount: 0,
      _maxListeners: undefined,
      on: function(event, listener) {
        // Simple on implementation to track listeners
        if (!this._events[event]) {
          this._events[event] = [];
        }
        this._events[event].push(listener);
        return this;
      },
      once: function(event, listener) { return this.on(event, listener); },
      emit: function(event, ...args) {
        // Simple emit implementation to trigger listeners
        if (this._events[event]) {
          this._events[event].forEach(listener => listener(...args));
        }
        return true;
      },
      addListener: function(event, listener) { return this.on(event, listener); },
      removeListener: function() { return this; },
      setMaxListeners: function() { return this; },
      getMaxListeners: function() { return 10; },
      listeners: function() { return []; },
      rawListeners: function() { return []; },
      listenerCount: function() { return 0; },
      eventNames: function() { return []; },
      prependListener: function() { return this; },
      prependOnceListener: function() { return this; },
      off: function() { return this; },
      removeAllListeners: function() { return this; }
    };
    
    // Add Symbol.for('nodejs.util.inspect.custom') to avoid serialization issues
    emitter[Symbol.for('nodejs.util.inspect.custom')] = () => 'MockEventEmitter';
    
    return emitter;
  };

  const stdin = createMockEventEmitter();
  stdin.write = () => true;
  stdin.end = () => {};
  
  const stdout = createMockEventEmitter();
  const stderr = createMockEventEmitter();
  
  const proc = createMockEventEmitter();
  proc.stdin = stdin;
  proc.stdout = stdout;
  proc.stderr = stderr;
  proc.kill = () => true;
  proc.pid = 12345;
  
  return proc;
}

describe('Command Runner', () => {
  let loggerMocks;
  let spawnSpy;
  
  beforeEach(() => {
    // Mock logger
    loggerMocks = mockLoggerFunctions(logger);
    
    // Create a mockProcess that we'll return from the spy
    const mockProc = createMockProcess();
    
    // Spy on spawn and return mockProc
    spawnSpy = spyOn(childProcess, 'spawn').mockImplementation((cmd, args, options) => {
      return mockProc;
    });
    
    // Reset the cached commands
    global.lastSuccessfulCommand = null;
    global.lastSuccessfulArgs = null;
  });
  
  afterEach(() => {
    spawnSpy.mockRestore();
  });
  
  // Test createInteractiveProcess
  describe('createInteractiveProcess', () => {
    it('should be a function', () => {
      expect(typeof commandRunner.createInteractiveProcess).toBe('function');
    });
    
    it('should spawn a new process with the provided command and args', () => {
      const process = commandRunner.createInteractiveProcess(
        'test-command',
        ['arg1', 'arg2'],
        {}
      );
      
      expect(spawnSpy).toHaveBeenCalled();
      expect(spawnSpy).toHaveBeenCalledWith(
        'test-command',
        ['arg1', 'arg2'],
        expect.objectContaining({
          stdio: ["pipe", "pipe", "pipe"]
        })
      );
    });
  });
  
  // Test createInteractiveProcessWithFallback
  describe('createInteractiveProcessWithFallback', () => {
    it('should be a function', () => {
      expect(typeof commandRunner.createInteractiveProcessWithFallback).toBe('function');
    });
    
    it('should try to use the primary process', () => {
      const result = commandRunner.createInteractiveProcessWithFallback(
        'primary-cmd', ['arg1'],
        'fallback-cmd', ['arg2'],
        {}, logger.Verbosity.Normal
      );
      
      expect(spawnSpy).toHaveBeenCalled();
      expect(spawnSpy).toHaveBeenCalledWith(
        'primary-cmd',
        ['arg1'],
        expect.anything()
      );
    });
    
    it('should update the cache with successful commands', () => {
      const result = commandRunner.createInteractiveProcessWithFallback(
        'success-cmd', ['arg1'],
        'fallback-cmd', ['arg2'],
        {}, logger.Verbosity.Normal
      );
      
      expect(result).toBeTruthy();
      expect(global.lastSuccessfulCommand).toBe('success-cmd');
      expect(global.lastSuccessfulArgs).toEqual(['arg1']);
    });
  });
}); 