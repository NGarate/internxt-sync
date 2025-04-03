import { WebDAVConnectivityOptions, WebDAVServiceOptions, WebDAVClientOptions, UploadResult, DirectoryResult } from '../interfaces/webdav.js';
/**
 * Tests for WebDAV Client Factory
 */

import { expect, describe, it, beforeEach, afterEach } from 'bun:test';
import { createWebDAVClient, createTestClient } from '../core/webdav/webdav-client-factory.js';

describe('WebDAV Client Factory', () => {
  describe('createTestClient', () => {
    it('should create a test client with appropriate methods', () => {
      const client = createTestClient();
      
      // Verify client has the methods provided by the implementation
      expect(typeof client.getDirectoryContents).toBe('function');
      expect(typeof client.createDirectory).toBe('function');
      expect(typeof client.putFileContents).toBe('function');
    });
    
    it('should handle method calls on test client', async () => {
      const client = createTestClient();
      
      // Test getDirectoryContents method
      const contentsResult = await client.getDirectoryContents('/test');
      expect(Array.isArray(contentsResult)).toBe(true);
      expect(contentsResult.length).toBe(0);
      
      // Test createDirectory method - simply call it without throwing
      await client.createDirectory('/test');
      
      // Test putFileContents method - simply call it without throwing
      await client.putFileContents('/test/file.txt', 'content');
      
      // If we reached here, the methods didn't throw
      expect(true).toBe(true);
    });
    
    it('should use custom implementations when provided', async () => {
      const customGetContents = async () => [{ filename: 'test.txt' }];
      const customCreateDir = async () => ({ status: 201 });
      const customPutFile = async () => ({ status: 200 });
      
      const client = createTestClient({
        getContentsImpl: customGetContents,
        createDirImpl: customCreateDir,
        putFileImpl: customPutFile
      });
      
      // Test custom implementations
      const contents = await client.getDirectoryContents();
      expect(contents).toEqual([{ filename: 'test.txt' }]);
      
      const createResult = await client.createDirectory();
      expect(createResult).toEqual({ status: 201 });
      
      const putResult = await client.putFileContents();
      expect(putResult).toEqual({ status: 200 });
    });
  });
}); 