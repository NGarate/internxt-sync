/**
 * Tests for Hash Cache
 */

import { expect, describe, it, beforeEach, afterEach, mock, spyOn } from 'bun:test';
import { HashCache } from './hash-cache';
import { Verbosity } from '../../interfaces/logger';
import * as logger from '../../utils/logger';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

describe('HashCache', () => {
  // Test data
  const cachePath = '/path/to/cache.json';
  const verbosity = Verbosity.Verbose;
  
  // Spies
  let loggerVerboseSpy;
  let loggerErrorSpy;
  let existsSyncSpy;
  let readFileSpy;
  let writeFileSpy;
  
  beforeEach(() => {
    // Spy on logger functions
    loggerVerboseSpy = spyOn(logger, 'verbose');
    loggerErrorSpy = spyOn(logger, 'error');
    
    // Spy on fs functions
    existsSyncSpy = spyOn(fs, 'existsSync').mockImplementation(() => true);
    readFileSpy = spyOn(fs.promises, 'readFile').mockImplementation(() => 
      Promise.resolve(JSON.stringify({'file1.txt': 'hash1', 'file2.txt': 'hash2'}))
    );
    writeFileSpy = spyOn(fs.promises, 'writeFile').mockImplementation(() => 
      Promise.resolve()
    );
  });
  
  afterEach(() => {
    // Reset spies
    loggerVerboseSpy.mockRestore();
    loggerErrorSpy.mockRestore();
    existsSyncSpy.mockRestore();
    readFileSpy.mockRestore();
    writeFileSpy.mockRestore();
  });
  
  describe('constructor', () => {
    it('should initialize with the provided cache path', () => {
      const cache = new HashCache(cachePath, verbosity);
      expect(cache.cachePath).toBe(cachePath);
    });
    
    it('should initialize with the provided verbosity level', () => {
      const cache = new HashCache(cachePath, verbosity);
      expect(cache.verbosity).toBe(verbosity);
    });
  });
  
  describe('load', () => {
    it('should load cache from file if it exists', async () => {
      const cache = new HashCache(cachePath, verbosity);
      const result = await cache.load();
      
      expect(existsSyncSpy).toHaveBeenCalledWith(cachePath);
      expect(readFileSpy).toHaveBeenCalledWith(cachePath, 'utf8');
      expect(result).toBe(true);
      expect(cache.cache.size).toBeGreaterThan(0);
      expect(loggerVerboseSpy).toHaveBeenCalled();
    });
    
    it('should return false if file does not exist', async () => {
      existsSyncSpy.mockImplementation(() => false);
      
      const cache = new HashCache(cachePath, verbosity);
      const result = await cache.load();
      
      expect(existsSyncSpy).toHaveBeenCalledWith(cachePath);
      expect(readFileSpy).not.toHaveBeenCalled();
      expect(result).toBe(false);
      expect(cache.cache.size).toBe(0);
    });
    
    it('should handle file read errors', async () => {
      readFileSpy.mockImplementation(() => Promise.reject(new Error('File read error')));
      
      const cache = new HashCache(cachePath, verbosity);
      const result = await cache.load();
      
      expect(existsSyncSpy).toHaveBeenCalledWith(cachePath);
      expect(readFileSpy).toHaveBeenCalledWith(cachePath, 'utf8');
      expect(result).toBe(false);
      expect(loggerErrorSpy).toHaveBeenCalled();
    });
    
    it('should handle JSON parse errors', async () => {
      readFileSpy.mockImplementation(() => Promise.resolve('invalid json'));
      
      const cache = new HashCache(cachePath, verbosity);
      const result = await cache.load();
      
      expect(existsSyncSpy).toHaveBeenCalledWith(cachePath);
      expect(readFileSpy).toHaveBeenCalledWith(cachePath, 'utf8');
      expect(result).toBe(false);
      expect(loggerErrorSpy).toHaveBeenCalled();
    });
  });
    
  describe('calculateHash', () => {
    it('should calculate a hash for a file', async () => {
      // Create a mock event emitter
      const mockStream = {
        on: function(event, callback) {
          // Store callbacks
          if (!this._callbacks) this._callbacks = {};
          this._callbacks[event] = callback;
          return this;
        },
        
        // Method to trigger events
        _emit: function(event, data) {
          if (this._callbacks && this._callbacks[event]) {
            this._callbacks[event](data);
          }
        }
      };
      
      // Mock createReadStream to return our mock stream
      const createReadStreamSpy = spyOn(fs, 'createReadStream').mockImplementation(() => mockStream);
      
      // Mock hash object
      const mockHash = {
        update: mock(() => mockHash),
        digest: mock(() => 'mock-hash-value')
      };
      
      // Mock createHash to return our mock hash
      const createHashSpy = spyOn(crypto, 'createHash').mockImplementation(() => mockHash);
      
      const cache = new HashCache(cachePath, verbosity);
      const filePath = '/path/to/file.txt';
      const hashPromise = cache.calculateHash(filePath);
      
      // Simulate stream events
      mockStream._emit('data', Buffer.from('test content'));
      mockStream._emit('end');
      
      const hash = await hashPromise;
      
      expect(createReadStreamSpy).toHaveBeenCalledWith(filePath);
      expect(createHashSpy).toHaveBeenCalledWith('md5');
      expect(mockHash.update).toHaveBeenCalled();
      expect(mockHash.digest).toHaveBeenCalledWith('hex');
      expect(hash).toBe('mock-hash-value');
      
      // Clean up spies
      createReadStreamSpy.mockRestore();
      createHashSpy.mockRestore();
    });
  });
  
  describe('updateHash', () => {
    it('should update the hash for a file', () => {
      const filePath = '/path/to/file.txt';
      const hash = 'new-hash';
      const cache = new HashCache(cachePath, verbosity);
      
      cache.updateHash(filePath, hash);
      
      // Normalize path the same way the method does
      const normalizedPath = path.normalize(filePath);
      
      // Verify the hash was stored correctly
      expect(cache.cache.get(normalizedPath)).toBe(hash);
    });
  });
  
  describe('size', () => {
    it('should return the size of the cache', () => {
      const cache = new HashCache(cachePath, verbosity);
      
      // Add some entries to the cache
      cache.cache.set('file1.txt', 'hash1');
      cache.cache.set('file2.txt', 'hash2');
      cache.cache.set('file3.txt', 'hash3');
      
      expect(cache.size).toBe(3);
    });
  });
}); 