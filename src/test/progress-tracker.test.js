/**
 * Tests for ProgressTracker
 */

import { expect, describe, it, beforeEach, afterEach } from 'bun:test';
import { ProgressTracker } from '../core/upload/progress-tracker.js';
import * as logger from '../utils/logger.js';

describe('ProgressTracker', () => {
  let progressTracker;
  let stdoutOutput = '';
  let originalStdoutWrite;
  
  // Setup and teardown for handling stdout capture
  beforeEach(() => {
    stdoutOutput = '';
    originalStdoutWrite = process.stdout.write;
    process.stdout.write = (str) => {
      stdoutOutput += str;
      return true;
    };
    
    // Create a fresh progress tracker for each test
    progressTracker = new ProgressTracker(logger.Verbosity.Normal);
  });
  
  afterEach(() => {
    // Restore stdout
    process.stdout.write = originalStdoutWrite;
  });
  
  describe('constructor', () => {
    it('should initialize with default values', () => {
      expect(progressTracker.verbosity).toBe(logger.Verbosity.Normal);
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
      expect(stdoutOutput).toContain('['); // Check that progress bar was displayed
    });
  });
  
  describe('recordSuccess and recordFailure', () => {
    it('should increment completed files counter', () => {
      progressTracker.recordSuccess();
      progressTracker.recordSuccess();
      
      expect(progressTracker.completedFiles).toBe(2);
    });
    
    it('should increment failed files counter', () => {
      progressTracker.recordFailure();
      
      expect(progressTracker.failedFiles).toBe(1);
    });
  });
  
  describe('startProgressUpdates and stopProgressUpdates', () => {
    // We'll use real setInterval and clearInterval, but with a stub to track calls
    let origSetInterval;
    let origClearInterval;
    let intervalCallback;
    let intervalDelay;
    let clearedIntervalId;
    
    beforeEach(() => {
      // Save originals
      origSetInterval = global.setInterval;
      origClearInterval = global.clearInterval;
      
      // Reset tracking variables
      intervalCallback = null;
      intervalDelay = null;
      clearedIntervalId = null;
      
      // Setup stubs
      global.setInterval = (callback, delay) => {
        intervalCallback = callback;
        intervalDelay = delay;
        return 123; // Mock interval ID
      };
      
      global.clearInterval = (id) => {
        clearedIntervalId = id;
      };
    });
    
    afterEach(() => {
      // Restore originals
      global.setInterval = origSetInterval;
      global.clearInterval = origClearInterval;
    });
    
    it('should start interval when startProgressUpdates is called', () => {  
      progressTracker.startProgressUpdates(200);
      
      expect(intervalCallback).not.toBeNull();
      expect(intervalDelay).toBe(200);
      expect(progressTracker.updateInterval).toBe(123);
    });
    
    it('should clear existing interval when starting updates', () => {
      // Setup test data
      progressTracker.updateInterval = 456;
      
      progressTracker.startProgressUpdates();
      
      expect(clearedIntervalId).toBe(456);
      expect(intervalCallback).not.toBeNull();
    });
    
    it('should stop interval when stopProgressUpdates is called', () => {
      // Setup test data
      progressTracker.updateInterval = 789;
      
      progressTracker.stopProgressUpdates();
      
      expect(clearedIntervalId).toBe(789);
      expect(progressTracker.updateInterval).toBeNull();
    });
    
    it('should handle stopProgressUpdates when no interval is set', () => {
      // Setup test data
      progressTracker.updateInterval = null;
      
      // Should not throw
      progressTracker.stopProgressUpdates();
      
      expect(clearedIntervalId).toBeNull();
    });
  });
  
  describe('displayProgress', () => {
    it('should display a progress bar', () => {
      progressTracker.totalFiles = 10;
      progressTracker.completedFiles = 3;
      progressTracker.failedFiles = 1;
      
      progressTracker.displayProgress();
      
      expect(stdoutOutput).toContain('40%');
      expect(stdoutOutput).toContain('4/10');
    });
    
    it('should display 0% when no files are being processed', () => {
      progressTracker.totalFiles = 0;
      
      progressTracker.displayProgress();
      
      expect(stdoutOutput).toContain('0%');
    });
    
    it('should add a newline when complete', () => {
      progressTracker.totalFiles = 5;
      progressTracker.completedFiles = 4;
      progressTracker.failedFiles = 1;
      
      progressTracker.displayProgress();
      
      expect(stdoutOutput.endsWith('\n')).toBe(true);
    });
  });
  
  describe('displaySummary', () => {
    // We'll use process.stdout.write to capture console output instead of mocking logger
    it('should display success message when no failures', () => {
      // Setup test data
      progressTracker.completedFiles = 10;
      progressTracker.failedFiles = 0;
      
      // Capture console output via process.stdout.write
      let consoleOutput = '';
      const origConsoleLog = console.log;
      console.log = (...args) => {
        consoleOutput += args.join(' ');
      };
      
      try {
        progressTracker.displaySummary();
        
        // Check the output
        expect(consoleOutput.includes('All 10 files uploaded')).toBe(true);
      } finally {
        // Restore console.log
        console.log = origConsoleLog;
      }
    });
    
    it('should display warning message when there are failures', () => {
      // Setup test data
      progressTracker.completedFiles = 8;
      progressTracker.failedFiles = 2;
      
      // Capture console output via process.stdout.write
      let consoleOutput = '';
      const origConsoleLog = console.log;
      console.log = (...args) => {
        consoleOutput += args.join(' ');
      };
      
      try {
        progressTracker.displaySummary();
        
        // Check the output
        expect(consoleOutput.includes('with issues: 8 succeeded, 2 failed')).toBe(true);
      } finally {
        // Restore console.log
        console.log = origConsoleLog;
      }
    });
  });
  
  describe('getProgressPercentage', () => {
    it('should calculate the correct percentage', () => {
      progressTracker.totalFiles = 20;
      progressTracker.completedFiles = 10;
      progressTracker.failedFiles = 5;
      
      expect(progressTracker.getProgressPercentage()).toBe(75);
    });
    
    it('should return 0 when no files', () => {
      progressTracker.totalFiles = 0;
      
      expect(progressTracker.getProgressPercentage()).toBe(0);
    });
  });
  
  describe('isComplete', () => {
    it('should return true when all files are processed', () => {
      progressTracker.totalFiles = 5;
      progressTracker.completedFiles = 3;
      progressTracker.failedFiles = 2;
      
      expect(progressTracker.isComplete()).toBe(true);
    });
    
    it('should return false when not all files are processed', () => {
      progressTracker.totalFiles = 5;
      progressTracker.completedFiles = 2;
      progressTracker.failedFiles = 1;
      
      expect(progressTracker.isComplete()).toBe(false);
    });
    
    it('should return false when no files to process', () => {
      progressTracker.totalFiles = 0;
      
      expect(progressTracker.isComplete()).toBe(false);
    });
  });
}); 