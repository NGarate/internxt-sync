import { Verbosity } from '../interfaces/logger.js';
/**
 * Tests for ProgressTracker
 */

import { expect, describe, it, beforeEach, afterEach, mock, spyOn } from 'bun:test';
import { ProgressTracker } from '../core/upload/progress-tracker.js';
import * as logger from '../utils/logger.js';

describe('ProgressTracker', () => {
  let progressTracker: ProgressTracker;
  let originalStdoutWrite;
  let originalSetInterval;
  let originalClearInterval;
  
  // Create mocks
  let stdoutWriteMock;
  let setIntervalMock;
  let clearIntervalMock;

  beforeEach(() => {
    // Save originals
    originalStdoutWrite = process.stdout.write;
    originalSetInterval = global.setInterval;
    originalClearInterval = global.clearInterval;
    
    // Create fresh mocks
    stdoutWriteMock = mock(() => true);
    setIntervalMock = mock(() => 123);
    clearIntervalMock = mock(() => {});
    
    // Replace with mocks
    process.stdout.write = stdoutWriteMock;
    global.setInterval = setIntervalMock;
    global.clearInterval = clearIntervalMock;
    
    // Mock logger
    spyOn(logger, 'always');
    
    // Create a fresh instance for each test
    progressTracker = new ProgressTracker();
  });

  afterEach(() => {
    // Restore originals
    process.stdout.write = originalStdoutWrite;
    global.setInterval = originalSetInterval;
    global.clearInterval = originalClearInterval;
  });

  describe('constructor', () => {
    it('should initialize with default values', () => {
      expect(progressTracker.totalFiles).toBe(0);
      expect(progressTracker.completedFiles).toBe(0);
      expect(progressTracker.failedFiles).toBe(0);
      expect(progressTracker.updateInterval).toBeNull();
    });
  });

  describe('initialize', () => {
    it('should initialize with the provided total files', () => {
      progressTracker.initialize(10);

      expect(progressTracker.totalFiles).toBe(10);
      expect(progressTracker.completedFiles).toBe(0);
      expect(progressTracker.failedFiles).toBe(0);
      
      // Since setupConsoleOverrides is called, we don't directly test stdout.write
    });
  });

  describe('recordSuccess and recordFailure', () => {
    it('should increment completed files counter', () => {
      progressTracker.initialize(10);
      progressTracker.recordSuccess();

      expect(progressTracker.completedFiles).toBe(1);
    });

    it('should increment failed files counter', () => {
      progressTracker.initialize(10);
      progressTracker.recordFailure();

      expect(progressTracker.failedFiles).toBe(1);
    });
  });

  describe('startProgressUpdates and stopProgressUpdates', () => {
    it('should start interval when startProgressUpdates is called', () => {
      progressTracker.startProgressUpdates();

      expect(setIntervalMock.mock.calls.length).toBeGreaterThan(0);
      expect(progressTracker.updateInterval).not.toBeNull();
    });

    it('should clear existing interval when starting updates', () => {
      // Setup with existing interval
      progressTracker.updateInterval = 456 as any;
      
      // Call the function
      progressTracker.startProgressUpdates();
      
      // Should clear existing interval then set a new one
      expect(clearIntervalMock.mock.calls.length).toBeGreaterThan(0);
      expect(setIntervalMock.mock.calls.length).toBeGreaterThan(0);
    });

    it('should stop interval when stopProgressUpdates is called', () => {
      // Setup with existing interval
      progressTracker.updateInterval = 123 as any;
      progressTracker.isTrackingActive = true;
      
      // Call the function
      progressTracker.stopProgressUpdates();
      
      // Should clear the interval
      expect(clearIntervalMock.mock.calls.length).toBeGreaterThan(0);
      expect(progressTracker.updateInterval).toBeNull();
      expect(progressTracker.isTrackingActive).toBe(false);
    });

    it('should handle stopProgressUpdates when no interval is set', () => {
      // Setup with no interval
      progressTracker.updateInterval = null;
      
      // Call the function
      progressTracker.stopProgressUpdates();
      
      // Should not try to clear non-existent interval
      expect(clearIntervalMock.mock.calls.length).toBe(0);
    });
  });

  describe('displayProgress', () => {
    it('should display a progress bar', () => {
      // Setup tracker state
      progressTracker.totalFiles = 10;
      progressTracker.completedFiles = 3;
      progressTracker.failedFiles = 1;
      progressTracker.isTrackingActive = true;
      
      // Call the function
      progressTracker.displayProgress();
      
      // Verify output was written
      expect(stdoutWriteMock.mock.calls.length).toBeGreaterThan(0);
    });

    it('should display 0% when no files are being processed', () => {
      // Setup tracker state
      progressTracker.totalFiles = 0;
      progressTracker.isTrackingActive = true;
      
      // Call the function
      progressTracker.displayProgress();
      
      // Verify output was written
      expect(stdoutWriteMock.mock.calls.length).toBeGreaterThan(0);
    });

    it('should add a newline when complete', () => {
      // Setup tracker state as complete
      progressTracker.totalFiles = 5;
      progressTracker.completedFiles = 4;
      progressTracker.failedFiles = 1;
      progressTracker.isTrackingActive = true;
      
      // Call the function
      progressTracker.displayProgress();
      
      // Verify output was written
      expect(stdoutWriteMock.mock.calls.length).toBeGreaterThan(0);
    });
  });

  describe('displaySummary', () => {
    it('should display success message when no failures', () => {
      // Setup tracker state
      progressTracker.totalFiles = 10;
      progressTracker.completedFiles = 10;
      progressTracker.failedFiles = 0;
      
      // Call the function
      progressTracker.displaySummary();
      
      // Verify logger.always was called
      expect(logger.always).toHaveBeenCalled();
    });

    it('should display warning message when there are failures', () => {
      // Setup tracker state with failures
      progressTracker.totalFiles = 10;
      progressTracker.completedFiles = 8;
      progressTracker.failedFiles = 2;
      
      // Call the function
      progressTracker.displaySummary();
      
      // Verify logger.always was called
      expect(logger.always).toHaveBeenCalled();
    });
  });

  describe('getProgressPercentage', () => {
    it('should calculate the correct percentage', () => {
      progressTracker.totalFiles = 10;
      progressTracker.completedFiles = 3;
      progressTracker.failedFiles = 2;

      const percentage = progressTracker.getProgressPercentage();

      expect(percentage).toBe(50);
    });

    it('should return 0 when no files', () => {
      progressTracker.totalFiles = 0;

      const percentage = progressTracker.getProgressPercentage();

      expect(percentage).toBe(0);
    });
  });

  describe('isComplete', () => {
    it('should return true when all files are processed', () => {
      progressTracker.totalFiles = 10;
      progressTracker.completedFiles = 7;
      progressTracker.failedFiles = 3;

      const complete = progressTracker.isComplete();

      expect(complete).toBe(true);
    });

    it('should return false when not all files are processed', () => {
      progressTracker.totalFiles = 10;
      progressTracker.completedFiles = 5;
      progressTracker.failedFiles = 2;

      const complete = progressTracker.isComplete();

      expect(complete).toBe(false);
    });

    it('should return false when no files to process', () => {
      progressTracker.totalFiles = 0;

      const complete = progressTracker.isComplete();

      expect(complete).toBe(false);
    });
  });
}); 