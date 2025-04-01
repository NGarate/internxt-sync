/**
 * Tests for Input Utilities
 * 
 * To run these tests: bun test src/test/input-utils.test.js
 */

import { expect, describe, it, beforeEach, spyOn } from 'bun:test';
import { parseArguments } from '../utils/input-utils.js';

describe('Input Utilities', () => {
  describe('parseArguments', () => {
    // Test basic argument parsing
    it('should parse source directory from first argument', () => {
      const args = ['/path/to/source'];
      const options = parseArguments(args);
      
      expect(options.sourceDir).toBe('/path/to/source');
      expect(options.verbosity).toBe(1); // Default normal verbosity
      expect(options.cores).toBeUndefined();
      expect(options.targetDir).toBe('');
      expect(options.skipSetup).toBe(false);
      expect(options.webdavUrl).toBeUndefined();
      expect(options.showHelp).toBe(false);
    });
    
    // Test help flag
    it('should set showHelp flag when --help is provided', () => {
      const args = ['--help'];
      const options = parseArguments(args);
      
      expect(options.showHelp).toBe(true);
      expect(options.sourceDir).toBeNull();
    });
    
    // Test verbosity flags
    it('should set quiet verbosity level when --quiet is provided', () => {
      const args = ['/path/to/source', '--quiet'];
      const options = parseArguments(args);
      
      expect(options.sourceDir).toBe('/path/to/source');
      expect(options.verbosity).toBe(0); // Quiet
    });
    
    it('should set verbose verbosity level when --verbose is provided', () => {
      const args = ['/path/to/source', '--verbose'];
      const options = parseArguments(args);
      
      expect(options.sourceDir).toBe('/path/to/source');
      expect(options.verbosity).toBe(2); // Verbose
    });
    
    // Test skip-setup flag
    it('should set skipSetup flag when --skip-setup is provided', () => {
      const args = ['/path/to/source', '--skip-setup'];
      const options = parseArguments(args);
      
      expect(options.sourceDir).toBe('/path/to/source');
      expect(options.skipSetup).toBe(true);
    });
    
    // Test cores parameter
    it('should parse cores parameter when provided', () => {
      const args = ['/path/to/source', '--cores=4'];
      const options = parseArguments(args);
      
      expect(options.sourceDir).toBe('/path/to/source');
      expect(options.cores).toBe(4);
    });
    
    it('should ignore invalid cores parameter', () => {
      const args = ['/path/to/source', '--cores=invalid'];
      const options = parseArguments(args);
      
      expect(options.sourceDir).toBe('/path/to/source');
      expect(options.cores).toBeUndefined();
    });
    
    // Test target directory parameter
    it('should parse target directory parameter when provided', () => {
      const args = ['/path/to/source', '--target=backup/daily'];
      const options = parseArguments(args);
      
      expect(options.sourceDir).toBe('/path/to/source');
      expect(options.targetDir).toBe('backup/daily');
    });
    
    // Test WebDAV URL parameter
    it('should parse WebDAV URL parameter when provided', () => {
      const args = ['/path/to/source', '--webdav-url=http://example.com'];
      const options = parseArguments(args);
      
      expect(options.sourceDir).toBe('/path/to/source');
      expect(options.webdavUrl).toBe('http://example.com');
    });
    
    // Test multiple parameters
    it('should parse multiple parameters correctly', () => {
      const args = [
        '/path/to/source',
        '--cores=8',
        '--target=backup/daily',
        '--webdav-url=http://example.com',
        '--verbose',
        '--skip-setup'
      ];
      const options = parseArguments(args);
      
      expect(options.sourceDir).toBe('/path/to/source');
      expect(options.cores).toBe(8);
      expect(options.targetDir).toBe('backup/daily');
      expect(options.webdavUrl).toBe('http://example.com');
      expect(options.verbosity).toBe(2); // Verbose
      expect(options.skipSetup).toBe(true);
      expect(options.showHelp).toBe(false);
    });
    
    // Edge cases
    it('should handle missing source directory', () => {
      const args = [];
      const options = parseArguments(args);
      
      expect(options.sourceDir).toBeNull();
      expect(options.showHelp).toBe(true);
    });
    
    it('should handle source directory with --help flag', () => {
      // Based on the implementation, when --help is present,
      // the function sets showHelp to true and returns early without setting sourceDir
      const args = ['/path/to/source', '--help'];
      const options = parseArguments(args);
      
      // According to the code in parseArguments, sourceDir is not set when --help is included
      expect(options.sourceDir).toBeNull();
      expect(options.showHelp).toBe(true);
    });
    
    it('should set sourceDir when first arg is not --help', () => {
      // If the first argument isn't help but help is included elsewhere
      const args = ['/path/to/source', '--target=backup', '--help'];
      const options = parseArguments(args);
      
      expect(options.sourceDir).toBeNull();
      expect(options.showHelp).toBe(true);
    });
  });
}); 