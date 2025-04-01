/**
 * Tests for Logger Utilities
 * 
 * To run these tests: bun test src/test/logger.test.js
 */

import { expect, describe, it, beforeEach, afterEach, spyOn } from 'bun:test';
import * as logger from '../utils/logger.js';
import chalk from 'chalk';

describe('Logger Utilities', () => {
  let consoleLogSpy;
  let consoleErrorSpy;
  
  beforeEach(() => {
    // Clear any previous mocks
    consoleLogSpy?.mockReset?.();
    consoleErrorSpy?.mockReset?.();
    
    // Set up new mocks for each test
    consoleLogSpy = spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = spyOn(console, 'error').mockImplementation(() => {});
  });
  
  afterEach(() => {
    // Ensure mocks are cleared after each test
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });
  
  // Test verbosity levels
  describe('Verbosity Levels', () => {
    it('should define the correct verbosity levels', () => {
      expect(logger.Verbosity.Quiet).toBe(0);
      expect(logger.Verbosity.Normal).toBe(1);
      expect(logger.Verbosity.Verbose).toBe(2);
    });
  });
  
  // Test log function
  describe('log', () => {
    it('should log message when level is less than or equal to current verbosity', () => {
      // Set up fresh spy for this specific test
      const logSpy = spyOn(console, 'log').mockImplementation(() => {});
      
      const message = 'Test message';
      const level = logger.Verbosity.Normal;
      const currentVerbosity = logger.Verbosity.Normal;
      
      logger.log(message, level, currentVerbosity);
      
      expect(logSpy).toHaveBeenCalledWith(message);
      logSpy.mockRestore();
    });
    
    it('should not log message when level is greater than current verbosity', () => {
      // Set up fresh spy for this specific test
      const logSpy = spyOn(console, 'log').mockImplementation(() => {});
      
      const message = 'Test message';
      const level = logger.Verbosity.Verbose;
      const currentVerbosity = logger.Verbosity.Normal;
      
      logger.log(message, level, currentVerbosity);
      
      expect(logSpy).not.toHaveBeenCalled();
      logSpy.mockRestore();
    });
  });
  
  // Test error function
  describe('error', () => {
    it('should log error message with red color', () => {
      // Set up fresh spy for this specific test
      const errorSpy = spyOn(console, 'error').mockImplementation(() => {});
      
      const message = 'Error message';
      
      logger.error(message);
      
      expect(errorSpy).toHaveBeenCalledWith(chalk.red(message));
      errorSpy.mockRestore();
    });
  });
  
  // Test warning function
  describe('warning', () => {
    it('should log warning message with yellow color when verbosity is Normal', () => {
      // Set up fresh spy for this specific test
      const logSpy = spyOn(console, 'log').mockImplementation(() => {});
      
      const message = 'Warning message';
      const currentVerbosity = logger.Verbosity.Normal;
      
      logger.warning(message, currentVerbosity);
      
      expect(logSpy).toHaveBeenCalledWith(chalk.yellow(message));
      logSpy.mockRestore();
    });
    
    it('should not log warning message when verbosity is Quiet', () => {
      // Set up fresh spy for this specific test
      const logSpy = spyOn(console, 'log').mockImplementation(() => {});
      
      const message = 'Warning message';
      const currentVerbosity = logger.Verbosity.Quiet;
      
      logger.warning(message, currentVerbosity);
      
      expect(logSpy).not.toHaveBeenCalled();
      logSpy.mockRestore();
    });
  });
  
  // Test info function
  describe('info', () => {
    it('should log info message with blue color when verbosity is Normal', () => {
      // Set up fresh spy for this specific test
      const logSpy = spyOn(console, 'log').mockImplementation(() => {});
      
      const message = 'Info message';
      const currentVerbosity = logger.Verbosity.Normal;
      
      logger.info(message, currentVerbosity);
      
      expect(logSpy).toHaveBeenCalledWith(chalk.blue(message));
      logSpy.mockRestore();
    });
    
    it('should not log info message when verbosity is Quiet', () => {
      // Set up fresh spy for this specific test
      const logSpy = spyOn(console, 'log').mockImplementation(() => {});
      
      const message = 'Info message';
      const currentVerbosity = logger.Verbosity.Quiet;
      
      logger.info(message, currentVerbosity);
      
      expect(logSpy).not.toHaveBeenCalled();
      logSpy.mockRestore();
    });
  });
  
  // Test success function
  describe('success', () => {
    it('should log success message with green color when verbosity is Normal', () => {
      // Set up fresh spy for this specific test
      const logSpy = spyOn(console, 'log').mockImplementation(() => {});
      
      const message = 'Success message';
      const currentVerbosity = logger.Verbosity.Normal;
      
      logger.success(message, currentVerbosity);
      
      expect(logSpy).toHaveBeenCalledWith(chalk.green(message));
      logSpy.mockRestore();
    });
    
    it('should not log success message when verbosity is Quiet', () => {
      // Set up fresh spy for this specific test
      const logSpy = spyOn(console, 'log').mockImplementation(() => {});
      
      const message = 'Success message';
      const currentVerbosity = logger.Verbosity.Quiet;
      
      logger.success(message, currentVerbosity);
      
      expect(logSpy).not.toHaveBeenCalled();
      logSpy.mockRestore();
    });
  });
  
  // Test verbose function
  describe('verbose', () => {
    it('should log verbose message when verbosity is Verbose', () => {
      // Set up fresh spy for this specific test
      const logSpy = spyOn(console, 'log').mockImplementation(() => {});
      
      const message = 'Verbose message';
      const currentVerbosity = logger.Verbosity.Verbose;
      
      logger.verbose(message, currentVerbosity);
      
      expect(logSpy).toHaveBeenCalledWith(message);
      logSpy.mockRestore();
    });
    
    it('should not log verbose message when verbosity is Normal', () => {
      // Set up fresh spy for this specific test
      const logSpy = spyOn(console, 'log').mockImplementation(() => {});
      
      const message = 'Verbose message';
      const currentVerbosity = logger.Verbosity.Normal;
      
      logger.verbose(message, currentVerbosity);
      
      expect(logSpy).not.toHaveBeenCalled();
      logSpy.mockRestore();
    });
  });
  
  // Test always function
  describe('always', () => {
    it('should always log message regardless of verbosity', () => {
      // Set up fresh spy for this specific test
      const logSpy = spyOn(console, 'log').mockImplementation(() => {});
      
      const message = 'Always message';
      
      logger.always(message);
      
      expect(logSpy).toHaveBeenCalledWith(message);
      logSpy.mockRestore();
    });
  });
}); 