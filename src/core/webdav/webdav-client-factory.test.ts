/**
 * Tests for WebDAV Client Factory
 */

import { expect, describe, it, beforeEach, afterEach, mock } from 'bun:test';
import { createWebDAVClient } from './webdav-client-factory';
import * as logger from '../../utils/logger';
import { Verbosity } from '../../interfaces/logger';
import { spyOn, createMockLoggers } from '../../../test-config/mocks/test-helpers';
import * as webdav from 'webdav';

// We don't need to explicitly mock the WebDAV client package
// as the returned client already has the methods we're checking for

describe('WebDAV Client Factory', () => {
  let loggerMocks;
  
  beforeEach(() => {
    // Create mocks for logger functions
    loggerMocks = createMockLoggers();
    
    // Mock the webdav.createClient function
    spyOn(webdav, 'createClient').mockImplementation((url, options) => {
      return {
        putFileContents: () => {},
        getDirectoryContents: () => {},
        createDirectory: () => {},
        config: { url, ...options }
      };
    });
  });
  
  it('should create a WebDAV client with the correct configuration', () => {
    const webdavUrl = 'https://example.com/webdav';
    
    // According to implementation, pass options object
    const options = {
      username: 'user',
      password: 'pass'
    };
    
    const client = createWebDAVClient(webdavUrl, options);
    
    // Verify client methods
    expect(client).toBeDefined();
    expect(typeof client.putFileContents).toBe('function');
    expect(typeof client.getDirectoryContents).toBe('function');
    expect(typeof client.createDirectory).toBe('function');
    
    // Verify the client config
    expect(client.config).toBeDefined();
    expect(client.config.username).toBe('user');
    expect(client.config.password).toBe('pass');
  });
  
  it('should create a WebDAV client with default options when not provided', () => {
    const webdavUrl = 'https://example.com/webdav';
    
    const client = createWebDAVClient(webdavUrl);
    
    // Verify client methods
    expect(client).toBeDefined();
    expect(typeof client.putFileContents).toBe('function');
    expect(typeof client.getDirectoryContents).toBe('function');
    expect(typeof client.createDirectory).toBe('function');
    
    // Verify default options were applied
    expect(client.config.username).toBe('webdav');
    expect(client.config.password).toBe('password');
  });
}); 