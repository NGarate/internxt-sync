import { Verbosity } from '../interfaces/logger.js';
import { WebDAVConnectivityOptions, WebDAVServiceOptions, WebDAVClientOptions, UploadResult, DirectoryResult } from '../interfaces/webdav.js';
/**
 * Test for WebDAV Connectivity Service
 */

import { expect, describe, it, beforeEach, afterEach, spyOn } from 'bun:test';
import { WebDAVConnectivityService } from '../core/webdav/webdav-connectivity-service.js';
import * as logger from '../utils/logger.js';

describe('WebDAV Connectivity Service', () => {
  let connectivityService;
  let mockClient;
  let successSpy;
  let errorSpy;
  let verboseSpy;
  
  // Setup before each test
  beforeEach(() => {
    // Create spies for logger functions
    successSpy = spyOn(logger, 'success');
    errorSpy = spyOn(logger, 'error');
    verboseSpy = spyOn(logger, 'verbose');
    
    // Create mock client with methods that return promises
    mockClient = {
      getDirectoryContents: async (path) => {
        if (path === '/error') {
          throw new Error('Connection error');
        }
        
        if (path === '/timeout') {
          throw new Error('Request timed out');
        }
        
        if (path === '/auth') {
          const error = new Error('Unauthorized');
          error.status = 401;
          throw error;
        }
        
        if (path === '/notfound') {
          const error = new Error('Not Found');
          error.status = 404;
          throw error;
        }
        
        return [
          { basename: 'file1.txt', filename: '/path/to/file1.txt', type: 'file' },
          { basename: 'file2.txt', filename: '/path/to/file2.txt', type: 'file' }
        ];
      }
    };
    
    // Create connectivity service with the mock client
    connectivityService = new WebDAVConnectivityService(mockClient, logger.Verbosity.Normal);
  });
  
  describe('constructor', () => {
    it('should initialize with the provided client and verbosity', () => {
      const testClient = {};
      const testVerbosity = logger.Verbosity.Verbose;
      
      const service = new WebDAVConnectivityService(testClient, testVerbosity);
      
      expect(service.client).toBe(testClient);
      expect(service.verbosity).toBe(testVerbosity);
    });
    
    it('should use default verbosity if not provided', () => {
      const testClient = {};
      
      const service = new WebDAVConnectivityService(testClient);
      
      expect(service.client).toBe(testClient);
      expect(service.verbosity).toBe(logger.Verbosity.Normal);
    });
  });
  
  describe('checkConnectivity', () => {
    it('should return true when server is reachable', async () => {
      const isConnected = await connectivityService.checkConnectivity();
      
      expect(isConnected).toBe(true);
      expect(successSpy).toHaveBeenCalledWith('WebDAV server is reachable', logger.Verbosity.Normal);
    });
    
    it('should return false when server is not reachable', async () => {
      mockClient.getDirectoryContents = async () => {
        throw new Error('Connection error');
      };
      
      const isConnected = await connectivityService.checkConnectivity();
      
      expect(isConnected).toBe(false);
      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to connect to WebDAV server: Connection error', 
        logger.Verbosity.Normal
      );
    });
    
    it('should handle timeout errors', async () => {
      mockClient.getDirectoryContents = async () => {
        throw new Error('Request timed out');
      };
      
      const isConnected = await connectivityService.checkConnectivity();
      
      expect(isConnected).toBe(false);
      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to connect to WebDAV server: Request timed out', 
        logger.Verbosity.Normal
      );
    });
    
    it('should handle authentication errors', async () => {
      mockClient.getDirectoryContents = async () => {
        const error = new Error('Unauthorized');
        error.status = 401;
        throw error;
      };
      
      const isConnected = await connectivityService.checkConnectivity();
      
      expect(isConnected).toBe(false);
      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to connect to WebDAV server: Unauthorized', 
        logger.Verbosity.Normal
      );
    });
    
    it('should handle 404 errors appropriately', async () => {
      mockClient.getDirectoryContents = async () => {
        const error = new Error('Not Found');
        error.status = 404;
        throw error;
      };
      
      const isConnected = await connectivityService.checkConnectivity();
      
      expect(isConnected).toBe(false);
      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to connect to WebDAV server: Not Found', 
        logger.Verbosity.Normal
      );
    });
    
    it('should use the provided path parameter', async () => {
      let callPath = '';
      mockClient.getDirectoryContents = async (path) => {
        callPath = path;
        return [];
      };
      
      await connectivityService.checkConnectivity('/custom/path');
      
      expect(callPath).toBe('/custom/path');
    });
    
    it('should log in appropriate verbosity modes', async () => {
      // Create service with verbose logging
      const verboseService = new WebDAVConnectivityService(mockClient, logger.Verbosity.Verbose);
      
      await verboseService.checkConnectivity();
      
      expect(successSpy).toHaveBeenCalledWith('WebDAV server is reachable', logger.Verbosity.Verbose);
      
      // Create service with quiet logging
      const quietService = new WebDAVConnectivityService(mockClient, logger.Verbosity.Quiet);
      
      // Reset the spy to check quiet mode behavior
      successSpy.mockClear();
      
      await quietService.checkConnectivity();
      
      expect(successSpy).toHaveBeenCalledWith('WebDAV server is reachable', logger.Verbosity.Quiet);
    });
    
    it('should handle errors in quiet mode', async () => {
      // Create service with quiet logging
      const quietService = new WebDAVConnectivityService(mockClient, logger.Verbosity.Quiet);
      
      // Mock client to throw an error
      mockClient.getDirectoryContents = async () => {
        throw new Error('Connection error');
      };
      
      // Reset the spy to check quiet mode behavior
      errorSpy.mockClear();
      
      const isConnected = await quietService.checkConnectivity();
      
      expect(isConnected).toBe(false);
      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to connect to WebDAV server: Connection error', 
        logger.Verbosity.Quiet
      );
    });
  });
}); 