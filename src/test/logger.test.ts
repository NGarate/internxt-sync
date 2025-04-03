import { Verbosity } from '../interfaces/logger.js';
/**
 * Tests for Logger Utilities
 * 
 * To run these tests: bun test src/test/logger.test.js
 */

import { expect, describe, it, beforeEach, afterEach, mock } from 'bun:test';
import * as logger from '../utils/logger.js';
import chalk from './mocks/chalk-mock';

describe('Logger Utilities', () => {
  let stdoutWriteMock;
  let stderrWriteMock;
  let originalStdoutWrite;
  let originalStderrWrite;

  beforeEach(() => {
    // Save originals
    originalStdoutWrite = process.stdout.write;
    originalStderrWrite = process.stderr.write;
    
    // Create mocks
    stdoutWriteMock = mock(() => true);
    stderrWriteMock = mock(() => true);
    
    // Replace with mocks
    process.stdout.write = stdoutWriteMock;
    process.stderr.write = stderrWriteMock;
  });

  afterEach(() => {
    // Restore originals
    process.stdout.write = originalStdoutWrite;
    process.stderr.write = originalStderrWrite;
  });

  describe('Verbosity Levels', () => {
    it('should define the correct verbosity levels', () => {
      expect(logger.Verbosity.Quiet).toBe(0);
      expect(logger.Verbosity.Normal).toBe(1);
      expect(logger.Verbosity.Verbose).toBe(2);
    });
  });

  describe('log', () => {
    it('should log message when level is less than or equal to current verbosity', () => {
      const message = 'Test message';
      const level = logger.Verbosity.Normal;
      const currentVerbosity = logger.Verbosity.Normal;

      logger.log(message, level, currentVerbosity);

      expect(stdoutWriteMock.mock.calls.length).toBeGreaterThan(0);
      // Check that the message was in the first call's arguments
      expect(stdoutWriteMock.mock.calls[0][0]).toContain(message);
    });

    it('should not log message when level is greater than current verbosity', () => {
      const message = 'Test message';
      const level = logger.Verbosity.Verbose;
      const currentVerbosity = logger.Verbosity.Normal;

      logger.log(message, level, currentVerbosity);

      expect(stdoutWriteMock.mock.calls.length).toBe(0);
    });
  });

  describe('error', () => {
    it('should log error message with red color', () => {
      const message = 'Error message';

      logger.error(message);

      expect(stderrWriteMock.mock.calls.length).toBeGreaterThan(0);
      expect(stderrWriteMock.mock.calls[0][0]).toContain(message);
    });
  });

  describe('warning', () => {
    it('should log warning message with yellow color when verbosity is Normal', () => {
      const message = 'Warning message';
      const currentVerbosity = logger.Verbosity.Normal;

      logger.warning(message, currentVerbosity);

      expect(stdoutWriteMock.mock.calls.length).toBeGreaterThan(0);
      expect(stdoutWriteMock.mock.calls[0][0]).toContain(message);
    });

    it('should not log warning message when verbosity is Quiet', () => {
      const message = 'Warning message';
      const currentVerbosity = logger.Verbosity.Quiet;

      logger.warning(message, currentVerbosity);

      expect(stdoutWriteMock.mock.calls.length).toBe(0);
    });
  });

  describe('info', () => {
    it('should log info message with blue color when verbosity is Normal', () => {
      const message = 'Info message';
      const currentVerbosity = logger.Verbosity.Normal;

      logger.info(message, currentVerbosity);

      expect(stdoutWriteMock.mock.calls.length).toBeGreaterThan(0);
      expect(stdoutWriteMock.mock.calls[0][0]).toContain(message);
    });

    it('should not log info message when verbosity is Quiet', () => {
      const message = 'Info message';
      const currentVerbosity = logger.Verbosity.Quiet;

      logger.info(message, currentVerbosity);

      expect(stdoutWriteMock.mock.calls.length).toBe(0);
    });
  });

  describe('success', () => {
    it('should log success message with green color when verbosity is Normal', () => {
      const message = 'Success message';
      const currentVerbosity = logger.Verbosity.Normal;

      logger.success(message, currentVerbosity);

      expect(stdoutWriteMock.mock.calls.length).toBeGreaterThan(0);
      expect(stdoutWriteMock.mock.calls[0][0]).toContain(message);
    });

    it('should not log success message when verbosity is Quiet', () => {
      const message = 'Success message';
      const currentVerbosity = logger.Verbosity.Quiet;

      logger.success(message, currentVerbosity);

      expect(stdoutWriteMock.mock.calls.length).toBe(0);
    });
  });

  describe('verbose', () => {
    it('should log verbose message when verbosity is Verbose', () => {
      const message = 'Verbose message';
      const currentVerbosity = logger.Verbosity.Verbose;

      logger.verbose(message, currentVerbosity);

      expect(stdoutWriteMock.mock.calls.length).toBeGreaterThan(0);
      expect(stdoutWriteMock.mock.calls[0][0]).toContain(message);
    });

    it('should not log verbose message when verbosity is Normal', () => {
      const message = 'Verbose message';
      const currentVerbosity = logger.Verbosity.Normal;

      logger.verbose(message, currentVerbosity);

      expect(stdoutWriteMock.mock.calls.length).toBe(0);
    });
  });

  describe('always', () => {
    it('should always log message regardless of verbosity', () => {
      const message = 'Always message';

      logger.always(message);

      expect(stdoutWriteMock.mock.calls.length).toBeGreaterThan(0);
      expect(stdoutWriteMock.mock.calls[0][0]).toContain(message);
    });
  });
}); 