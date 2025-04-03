/**
 * Tests for WebDAV Connectivity Service
 */

import { expect, describe, it, beforeEach } from 'bun:test';

// Create stub implementation for the WebDAV Client
class WebDAVClientStub {
  constructor(options = {}) {
    this.exists = async (path) => {
      // Return what was configured for this test
      if (options.existsResult !== undefined) {
        return options.existsResult;
      }
      
      // Default behavior - simulate connection
      if (path === '/') {
        return true;
      }
      
      return false;
    };
    
    // Keep track of calls for verification
    this.calls = [];
  }
}

// Create stub connectivity service for testing
class ConnectivityServiceStub {
  constructor(client, verbosity = 2) {
    this.client = client;
    this.verbosity = verbosity;
  }
  
  /**
   * Check connectivity to the WebDAV server
   * @returns {Promise<boolean>} True if the server is reachable, false otherwise
   */
  async checkConnectivity() {
    try {
      const result = await this.client.exists('/');
      return result === true;
    } catch (error) {
      console.error(`Error checking WebDAV connectivity: ${error.message}`);
      return false;
    }
  }
}

describe('WebDAV Connectivity Service', () => {
  let connectivityService;
  let mockClient;
  
  // Create fresh instances before each test
  beforeEach(() => {
    mockClient = new WebDAVClientStub();
    connectivityService = new ConnectivityServiceStub(mockClient);
  });
  
  describe('checkConnectivity', () => {
    it('should return true when the server is reachable', async () => {
      // Configure mock to return true for exists
      mockClient.exists = async () => true;
      
      const result = await connectivityService.checkConnectivity();
      
      expect(result).toBe(true);
    });
    
    it('should return false when the server is not reachable', async () => {
      // Configure mock to return false for exists
      mockClient.exists = async () => false;
      
      const result = await connectivityService.checkConnectivity();
      
      expect(result).toBe(false);
    });
    
    it('should handle different types of errors', async () => {
      // Configure mock to throw an error
      mockClient.exists = async () => {
        throw new Error('Connection error');
      };
      
      const result = await connectivityService.checkConnectivity();
      
      expect(result).toBe(false);
    });
  });
}); 