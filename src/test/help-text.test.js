/**
 * Tests for Help Text Utilities
 * 
 * To run these tests: bun test src/test/help-text.test.js
 */

import { expect, describe, it, beforeEach, spyOn } from 'bun:test';
import * as helpText from '../utils/help-text.js';
import * as envUtils from '../utils/env-utils.js';
import * as logger from '../utils/logger.js';

describe('Help Text Utilities', () => {
  let isBunEnvironmentSpy;
  let loggerAlwaysSpy;
  
  beforeEach(() => {
    isBunEnvironmentSpy = spyOn(envUtils, 'isBunEnvironment');
    // Reset the spy before each test
    if (loggerAlwaysSpy) {
      loggerAlwaysSpy.mockRestore();
    }
    loggerAlwaysSpy = spyOn(logger, 'always');
  });
  
  // Test showHelp function
  describe('showHelp', () => {
    it('should show help text for Bun environment', () => {
      isBunEnvironmentSpy.mockImplementation(() => true);
      
      // Custom implementation to capture the help text content
      let capturedHelpText = '';
      loggerAlwaysSpy.mockImplementation((text) => {
        capturedHelpText = text;
      });
      
      helpText.showHelp();
      
      expect(loggerAlwaysSpy).toHaveBeenCalled();
      
      // Check for Bun-specific content
      expect(capturedHelpText).toContain('bun internxt-uploader.ts');
      expect(capturedHelpText).not.toContain('node internxt-uploader.js');
      
      // Check for essential help sections
      expect(capturedHelpText).toContain('Usage:');
      expect(capturedHelpText).toContain('Options:');
      expect(capturedHelpText).toContain('--cores=<number>');
      expect(capturedHelpText).toContain('default: 2/3 of CPU cores');
      expect(capturedHelpText).toContain('--target=<path>');
      expect(capturedHelpText).toContain('--quiet');
      expect(capturedHelpText).toContain('--verbose');
      expect(capturedHelpText).toContain('--skip-setup');
      expect(capturedHelpText).toContain('--webdav-url=<url>');
      expect(capturedHelpText).toContain('--help');
      
      // Check for examples section
      expect(capturedHelpText).toContain('Examples:');
    });
    
    it('should show help text for Node environment', () => {
      isBunEnvironmentSpy.mockImplementation(() => false);
      
      // Custom implementation to capture the help text content
      let capturedHelpText = '';
      loggerAlwaysSpy.mockImplementation((text) => {
        capturedHelpText = text;
      });
      
      helpText.showHelp();
      
      expect(loggerAlwaysSpy).toHaveBeenCalled();
      
      // Check for Node-specific content
      expect(capturedHelpText).toContain('node internxt-uploader.js');
      expect(capturedHelpText).not.toContain('bun internxt-uploader.ts');
      
      // Check for essential help sections
      expect(capturedHelpText).toContain('Usage:');
      expect(capturedHelpText).toContain('Options:');
      expect(capturedHelpText).toContain('--cores=<number>');
      expect(capturedHelpText).toContain('default: 2/3 of CPU cores');
      expect(capturedHelpText).toContain('--target=<path>');
      expect(capturedHelpText).toContain('--quiet');
      expect(capturedHelpText).toContain('--verbose');
      expect(capturedHelpText).toContain('--skip-setup');
      expect(capturedHelpText).toContain('--webdav-url=<url>');
      expect(capturedHelpText).toContain('--help');
      
      // Check for examples section
      expect(capturedHelpText).toContain('Examples:');
    });
  });
  
  // Test getHelpText function
  describe('getHelpText', () => {
    it('should return help text string for Bun environment', () => {
      isBunEnvironmentSpy.mockImplementation(() => true);
      
      const result = helpText.getHelpText();
      
      // Check for Bun-specific content
      expect(result).toContain('bun internxt-uploader.ts');
      expect(result).not.toContain('node internxt-uploader.js');
      
      // Check for essential help sections
      expect(result).toContain('Usage:');
      expect(result).toContain('Options:');
      expect(result).toContain('--cores=<number>');
      expect(result).toContain('default: 2/3 of CPU cores');
      expect(result).toContain('--target=<path>');
      expect(result).toContain('--quiet');
      expect(result).toContain('--verbose');
      expect(result).toContain('--skip-setup');
      expect(result).toContain('--webdav-url=<url>');
      expect(result).toContain('--help');
      
      // Check for examples section
      expect(result).toContain('Examples:');
    });
    
    it('should return help text string for Node environment', () => {
      isBunEnvironmentSpy.mockImplementation(() => false);
      
      const result = helpText.getHelpText();
      
      // Check for Node-specific content
      expect(result).toContain('node internxt-uploader.js');
      expect(result).not.toContain('bun internxt-uploader.ts');
      
      // Check for essential help sections
      expect(result).toContain('Usage:');
      expect(result).toContain('Options:');
      expect(result).toContain('--cores=<number>');
      expect(result).toContain('default: 2/3 of CPU cores');
      expect(result).toContain('--target=<path>');
      expect(result).toContain('--quiet');
      expect(result).toContain('--verbose');
      expect(result).toContain('--skip-setup');
      expect(result).toContain('--webdav-url=<url>');
      expect(result).toContain('--help');
      
      // Check for examples section
      expect(result).toContain('Examples:');
    });
  });
}); 