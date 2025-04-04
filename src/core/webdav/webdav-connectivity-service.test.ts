/**
 * Tests for WebDAV Connectivity Service
 */

import { expect, describe, it, beforeEach, afterEach, mock } from 'bun:test';
import { WebDAVConnectivityService } from './webdav-connectivity-service';
import { Verbosity } from '../../utils/logger';
import * as logger from '../../utils/logger';
import { mockLoggerFunctions } from '../../../test-config/bun-test-helpers';

// Mock WebDAV client
class WebDAVClientStub {
  constructor(options = {}) {
    this.calls = {
      getDirectoryContents: [],
      getQuota: [],
      checkServerCompatibility: [],
      getFreeSpace: [],
      getUsedSpace: []
    };
    
    // Default results
    this.getDirectoryContentResult = options.getDirectoryContentResult !== undefined 
      ? options.getDirectoryContentResult 
      : true;
    
    this.getQuotaResult = options.getQuotaResult !== undefined 
      ? options.getQuotaResult 
      : true;
      
    this.checkServerCompatibilityResult = options.checkServerCompatibilityResult !== undefined
      ? options.checkServerCompatibilityResult
      : true;
      
    this.getFreeSpaceResult = options.getFreeSpaceResult !== undefined
      ? options.getFreeSpaceResult
      : true;
      
    this.getUsedSpaceResult = options.getUsedSpaceResult !== undefined
      ? options.getUsedSpaceResult
      : true;
  }
  
  async getDirectoryContents(path) {
    this.calls.getDirectoryContents.push(path);
    
    if (!this.getDirectoryContentResult) {
      throw new Error('Failed to get directory contents');
    }
    
    return [
      { basename: 'file1.txt', filename: `${path}/file1.txt`, type: 'file' },
      { basename: 'file2.txt', filename: `${path}/file2.txt`, type: 'file' }
    ];
  }
  
  async getQuota() {
    this.calls.getQuota.push({});
    
    if (!this.getQuotaResult) {
      throw new Error('Failed to get quota information');
    }
    
    return {
      used: 1024,
      available: 1024 * 1024
    };
  }
  
  async checkServerCompatibility() {
    this.calls.checkServerCompatibility.push({});
    
    if (!this.checkServerCompatibilityResult) {
      throw new Error('Failed to check server compatibility');
    }
    
    return {
      version: '1.0',
      capabilities: ['1', '2', '3']
    };
  }
  
  async getFreeSpace() {
    this.calls.getFreeSpace.push({});
    
    if (!this.getFreeSpaceResult) {
      throw new Error('Failed to get free space');
    }
    
    return 1024 * 1024;
  }
  
  async getUsedSpace() {
    this.calls.getUsedSpace.push({});
    
    if (!this.getUsedSpaceResult) {
      throw new Error('Failed to get used space');
    }
    
    return 1024;
  }
}

describe('WebDAV Connectivity Service', () => {
  let connectivityService;
  let mockClient;
  let loggerMocks;
  
  beforeEach(() => {
    // Create spies for logger functions
    loggerMocks = mockLoggerFunctions(logger);
    
    mockClient = new WebDAVClientStub();
    connectivityService = new WebDAVConnectivityService(mockClient);
  });
  
  describe('constructor', () => {
    it('should initialize with the provided client and verbosity', () => {
      const testClient = {};
      const testVerbosity = Verbosity.Verbose;
      
      const service = new WebDAVConnectivityService(testClient, testVerbosity);
      
      expect(service.client).toBe(testClient);
      expect(service.verbosity).toBe(testVerbosity);
    });
    
    it('should use default verbosity if not provided', () => {
      const testClient = {};
      
      const service = new WebDAVConnectivityService(testClient);
      
      expect(service.client).toBe(testClient);
      expect(service.verbosity).toBe(Verbosity.Normal);
    });
  });
  
  describe('checkConnectivity', () => {
    it('should return true when connectivity check succeeds with getDirectoryContents', async () => {
      const result = await connectivityService.checkConnectivity();
      
      expect(result).toBe(true);
      expect(mockClient.calls.getDirectoryContents).toContain('/');
    });
    
    it('should return false when connectivity check fails with getDirectoryContents', async () => {
      // First create a new client and service that will fail both checks
      mockClient = new WebDAVClientStub({
        getDirectoryContentResult: false,
        getQuotaResult: false
      });
      connectivityService = new WebDAVConnectivityService(mockClient);
      
      const result = await connectivityService.checkConnectivity();
      
      expect(result).toBe(false);
      expect(mockClient.calls.getDirectoryContents).toContain('/');
    });
    
    it('should try getQuota as fallback when getDirectoryContents fails', async () => {
      mockClient = new WebDAVClientStub({
        getDirectoryContentResult: false,
        getQuotaResult: true
      });
      connectivityService = new WebDAVConnectivityService(mockClient);
      
      const result = await connectivityService.checkConnectivity();
      
      expect(result).toBe(true);
      expect(mockClient.calls.getQuota.length).toBeGreaterThan(0);
    });
    
    it('should return false when both connectivity checks fail', async () => {
      mockClient = new WebDAVClientStub({
        getDirectoryContentResult: false,
        getQuotaResult: false
      });
      connectivityService = new WebDAVConnectivityService(mockClient);
      
      const result = await connectivityService.checkConnectivity();
      
      expect(result).toBe(false);
      expect(mockClient.calls.getQuota.length).toBeGreaterThan(0);
    });
  });
  
  describe('server compatibility and quota methods', () => {
    it('should check server compatibility (success case)', async () => {
      const result = await connectivityService.checkServerCompatibility();
      
      expect(result).toBe(true);
      expect(mockClient.calls.checkServerCompatibility.length).toBeGreaterThan(0);
    });
    
    it('should check server compatibility (failure case)', async () => {
      mockClient.checkServerCompatibilityResult = false;
      
      const result = await connectivityService.checkServerCompatibility();
      
      expect(result).toBe(false);
    });
    
    it('should get free space when available', async () => {
      const result = await connectivityService.getFreeSpace();
      
      expect(result).toBe(1024 * 1024);
      expect(mockClient.calls.getFreeSpace.length).toBeGreaterThan(0);
    });
    
    it('should return null for free space when quota check fails', async () => {
      mockClient.getFreeSpaceResult = false;
      
      const result = await connectivityService.getFreeSpace();
      
      expect(result).toBe(null);
    });
    
    it('should get used space when available', async () => {
      const result = await connectivityService.getUsedSpace();
      
      expect(result).toBe(1024);
      expect(mockClient.calls.getUsedSpace.length).toBeGreaterThan(0);
    });
    
    it('should return null for used space when quota check fails', async () => {
      mockClient.getUsedSpaceResult = false;
      
      const result = await connectivityService.getUsedSpace();
      
      expect(result).toBe(null);
    });
  });
}); 