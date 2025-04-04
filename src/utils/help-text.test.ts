/**
 * Tests for Help Text Utilities
 */

import { expect, describe, it, beforeEach, spyOn } from 'bun:test';
import * as helpText from './help-text';
import * as envUtils from './env-utils';
import * as logger from './logger';
import { Verbosity } from '../interfaces/logger';

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
      expect(capturedHelpText).toContain('bun webdav-backup.ts');
      expect(capturedHelpText).not.toContain('node webdav-backup.js');
      
      // Check for essential help sections
      expect(capturedHelpText).toContain('Usage:');
      expect(capturedHelpText).toContain('Options:');
      expect(capturedHelpText).toContain('--cores=<number>');
      expect(capturedHelpText).toContain('default: 2/3 of CPU cores');
      expect(capturedHelpText).toContain('--target=<path>');
      expect(capturedHelpText).toContain('--quiet');
      expect(capturedHelpText).toContain('--verbose');
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
      expect(capturedHelpText).toContain('node webdav-backup.js');
      expect(capturedHelpText).not.toContain('bun webdav-backup.ts');
      
      // Check for essential help sections
      expect(capturedHelpText).toContain('Usage:');
      expect(capturedHelpText).toContain('Options:');
      expect(capturedHelpText).toContain('--cores=<number>');
      expect(capturedHelpText).toContain('default: 2/3 of CPU cores');
      expect(capturedHelpText).toContain('--target=<path>');
      expect(capturedHelpText).toContain('--quiet');
      expect(capturedHelpText).toContain('--verbose');
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
      
      const helpTextContent = helpText.getHelpText();
      
      // Check for Bun-specific content
      expect(helpTextContent).toContain('bun webdav-backup.ts');
      expect(helpTextContent).not.toContain('node webdav-backup.js');
      
      // Check for essential help sections
      expect(helpTextContent).toContain('Usage:');
      expect(helpTextContent).toContain('Options:');
      expect(helpTextContent).toContain('--cores=<number>');
      expect(helpTextContent).toContain('default: 2/3 of CPU cores');
      expect(helpTextContent).toContain('--target=<path>');
      expect(helpTextContent).toContain('--quiet');
      expect(helpTextContent).toContain('--verbose');
      expect(helpTextContent).toContain('--webdav-url=<url>');
      expect(helpTextContent).toContain('--help');
      
      // Check for examples section
      expect(helpTextContent).toContain('Examples:');
    });
    
    it('should return help text string for Node environment', () => {
      isBunEnvironmentSpy.mockImplementation(() => false);
      
      const helpTextContent = helpText.getHelpText();
      
      // Check for Node-specific content
      expect(helpTextContent).toContain('node webdav-backup.js');
      expect(helpTextContent).not.toContain('bun webdav-backup.ts');
      
      // Check for essential help sections
      expect(helpTextContent).toContain('Usage:');
      expect(helpTextContent).toContain('Options:');
      expect(helpTextContent).toContain('--cores=<number>');
      expect(helpTextContent).toContain('default: 2/3 of CPU cores');
      expect(helpTextContent).toContain('--target=<path>');
      expect(helpTextContent).toContain('--quiet');
      expect(helpTextContent).toContain('--verbose');
      expect(helpTextContent).toContain('--webdav-url=<url>');
      expect(helpTextContent).toContain('--help');
      
      // Check for examples section
      expect(helpTextContent).toContain('Examples:');
    });
  });
}); 