/**
 * Tests for Progress Tracker
 */

import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test';
import { ProgressTracker } from './progress-tracker';
import { Verbosity } from '../../interfaces/logger';

describe('ProgressTracker', () => {
  // Save original process.stdout.write
  const originalStdoutWrite = process.stdout.write;
  
  beforeEach(() => {
    // Mock process.stdout.write
    process.stdout.write = mock(() => {});
  });
  
  afterEach(() => {
    // Restore original process.stdout.write
    process.stdout.write = originalStdoutWrite;
  });
  
  describe('constructor', () => {
    it('should initialize with default values', () => {
      const tracker = new ProgressTracker();
      
      expect(tracker.totalFiles).toBe(0);
      expect(tracker.completedFiles).toBe(0);
      expect(tracker.failedFiles).toBe(0);
    });
  });
  
  describe('initialize', () => {
    it('should initialize with the provided total files', () => {
      const tracker = new ProgressTracker();
      
      tracker.initialize(10);
      
      expect(tracker.totalFiles).toBe(10);
      expect(tracker.completedFiles).toBe(0);
      expect(tracker.failedFiles).toBe(0);
    });
  });
  
  describe('record methods', () => {
    it('should increment counters correctly', () => {
      const tracker = new ProgressTracker();
      tracker.initialize(10);
      
      tracker.recordSuccess();
      expect(tracker.completedFiles).toBe(1);
      
      tracker.recordFailure();
      expect(tracker.failedFiles).toBe(1);
    });
  });
  
  describe('progress calculation', () => {
    it('should calculate progress correctly', () => {
      const tracker = new ProgressTracker();
      tracker.initialize(10);
      tracker.completedFiles = 7;
      
      expect(tracker.getProgressPercentage()).toBe(70);
    });
    
    it('should determine completion status correctly', () => {
      const tracker = new ProgressTracker();
      tracker.initialize(10);
      
      expect(tracker.isComplete()).toBe(false);
      
      tracker.completedFiles = 8;
      tracker.failedFiles = 2;
      
      expect(tracker.isComplete()).toBe(true);
    });
  });
}); 