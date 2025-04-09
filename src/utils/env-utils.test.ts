/**
 * Tests for Environment Utilities
 */

import { expect, describe, it, beforeEach, afterEach, spyOn, mock } from 'bun:test';
import * as envUtils from './env-utils';
import os from 'os';

describe('Environment Utilities', () => {
  // Test optimal concurrency calculation
  describe('getOptimalConcurrency', () => {
    let cpusSpy;
    
    beforeEach(() => {
      cpusSpy = spyOn(os, 'cpus');
    });
    
    it('should use user-specified cores when provided', () => {
      expect(envUtils.getOptimalConcurrency(4)).toBe(4);
    });
    
    it('should ignore invalid user-specified cores', () => {
      // Mock 6 CPUs
      cpusSpy.mockImplementation(() => Array(6).fill({}));
      
      expect(envUtils.getOptimalConcurrency(0)).toBe(4); // 2/3 of 6 = 4
      expect(envUtils.getOptimalConcurrency(-1)).toBe(4);
      expect(envUtils.getOptimalConcurrency(NaN)).toBe(4);
      expect(envUtils.getOptimalConcurrency('invalid')).toBe(4);
    });
    
    it('should calculate 2/3 of available cores when no user value is specified', () => {
      // Mock 6 CPUs
      cpusSpy.mockImplementation(() => Array(6).fill({}));
      expect(envUtils.getOptimalConcurrency()).toBe(4); // 2/3 of 6 = 4
      
      // Mock 3 CPUs
      cpusSpy.mockImplementation(() => Array(3).fill({}));
      expect(envUtils.getOptimalConcurrency()).toBe(2); // 2/3 of 3 = 2
      
      // Mock 12 CPUs
      cpusSpy.mockImplementation(() => Array(12).fill({}));
      expect(envUtils.getOptimalConcurrency()).toBe(8); // 2/3 of 12 = 8
    });
    
    it('should return at least 1 core even with minimal CPUs', () => {
      // Mock 1 CPU
      cpusSpy.mockImplementation(() => Array(1).fill({}));
      expect(envUtils.getOptimalConcurrency()).toBe(1); // Minimum of 1 even if 2/3 of 1 < 1
    });
  });
  
  // Test version info retrieval
  describe('getVersionInfo', () => {
    it('should include platform and architecture information', () => {
      const info = envUtils.getVersionInfo();
      
      // We can't easily mock Bun.version, so just verify it's a string
      expect(typeof info.bunVersion).toBe('string');
      expect(info.platform).toBe(process.platform);
      expect(info.arch).toBe(process.arch);
    });
  });
}); 