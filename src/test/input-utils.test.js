/**
 * Tests for input utilities
 */

import { expect, describe, it, beforeEach, afterEach, jest, mock } from 'bun:test';
import { 
  parseArguments, 
  createReadlineInterface, 
  promptUser,
  getCredentials
} from '../utils/input-utils.js';
import readline from 'readline';
import * as inputUtils from '../utils/input-utils.js';

// Create mock for other functions in input-utils.js
mock('../utils/input-utils.js', () => {
  const actual = jest.requireActual('../utils/input-utils.js');
  return {
    ...actual
  };
});

describe('Input Utilities', () => {
  describe('createReadlineInterface', () => {
    let originalCreateInterface;
    
    beforeEach(() => {
      // Save original method
      originalCreateInterface = readline.createInterface;
      
      // Create a mock createInterface function
      readline.createInterface = jest.fn(() => ({
        question: jest.fn(),
        close: jest.fn(),
        on: jest.fn()
      }));
    });
    
    afterEach(() => {
      // Restore original method
      readline.createInterface = originalCreateInterface;
    });
    
    it('should create readline interface with stdin and stdout', () => {
      createReadlineInterface();
      
      expect(readline.createInterface).toHaveBeenCalledWith({
        input: process.stdin,
        output: process.stdout
      });
    });
    
    it('should return an interface with question and close methods', () => {
      const rl = createReadlineInterface();
      
      expect(rl).toHaveProperty('question');
      expect(rl).toHaveProperty('close');
    });
  });
  
  describe('promptUser', () => {
    let originalCreateInterface;
    let mockInterface;
    
    beforeEach(() => {
      // Save original method
      originalCreateInterface = readline.createInterface;
      
      // Create a mock interface
      mockInterface = {
        question: jest.fn((question, callback) => {
          // Simulate user answering with "test input"
          callback('test input');
        }),
        close: jest.fn()
      };
      
      // Replace readline.createInterface with a mock
      readline.createInterface = jest.fn(() => mockInterface);
    });
    
    afterEach(() => {
      // Restore original method
      readline.createInterface = originalCreateInterface;
    });
    
    it('should prompt the user with the provided question', async () => {
      await promptUser('Enter your name:');
      
      expect(mockInterface.question).toHaveBeenCalledWith(
        'Enter your name:',
        expect.any(Function)
      );
    });
    
    it('should return the user input', async () => {
      const result = await promptUser('Enter your name:');
      
      expect(result).toBe('test input');
    });
    
    it('should close the readline interface when done', async () => {
      await promptUser('Enter your name:');
      
      expect(mockInterface.close).toHaveBeenCalled();
    });
  });
  
  describe('getCredentials', () => {
    let promptUserSpy;
    let getSecurePasswordSpy;
    
    beforeEach(() => {
      // Create spies to monitor function calls
      promptUserSpy = jest.spyOn(inputUtils, 'promptUser').mockResolvedValue('testuser');
      getSecurePasswordSpy = jest.spyOn(inputUtils, 'getSecurePassword').mockResolvedValue('testpassword');
    });
    
    afterEach(() => {
      // Clean up spies
      promptUserSpy.mockRestore();
      getSecurePasswordSpy.mockRestore();
    });
    
    it('should prompt for username and password', async () => {
      const result = await getCredentials('Custom Username', 'Custom Password');
      
      // Check if the prompt functions were called with the correct arguments
      expect(promptUserSpy).toHaveBeenCalledWith('Custom Username: ');
      expect(getSecurePasswordSpy).toHaveBeenCalledWith('Custom Password');
      
      // Verify the return value
      expect(result).toEqual({
        username: 'testuser',
        password: 'testpassword'
      });
    });
    
    it('should use default prompts when not provided', async () => {
      const result = await getCredentials();
      
      // Check if the prompt functions were called with default arguments
      expect(promptUserSpy).toHaveBeenCalledWith('Username: ');
      expect(getSecurePasswordSpy).toHaveBeenCalledWith('Password');
      
      // Verify the return value
      expect(result).toEqual({
        username: 'testuser',
        password: 'testpassword'
      });
    });
  });
  
  describe('parseArguments', () => {
    it('should parse CLI-specific source directory argument', () => {
      const args = ['/path/to/source'];
      const options = parseArguments(args);
      
      expect(options.sourceDir).toBe('/path/to/source');
      expect(options.verbosity).toBe(1); // Default normal verbosity
      expect(options.targetDir).toBe('');
      expect(options.skipSetup).toBe(false);
      expect(options.showHelp).toBe(false);
    });

    it('should set quiet verbosity level when --quiet is provided', () => {
      const args = ['/path/to/source', '--quiet'];
      const options = parseArguments(args);
      
      expect(options.sourceDir).toBe('/path/to/source');
      expect(options.verbosity).toBe(0); // Quiet
      expect(options.targetDir).toBe('');
      expect(options.skipSetup).toBe(false);
      expect(options.showHelp).toBe(false);
    });

    it('should set verbose verbosity level when --verbose is provided', () => {
      const args = ['/path/to/source', '--verbose'];
      const options = parseArguments(args);
      
      expect(options.sourceDir).toBe('/path/to/source');
      expect(options.verbosity).toBe(2); // Verbose
      expect(options.targetDir).toBe('');
      expect(options.skipSetup).toBe(false);
      expect(options.showHelp).toBe(false);
    });

    it('should set skipSetup flag when --skip-setup is provided', () => {
      const args = ['/path/to/source', '--skip-setup'];
      const options = parseArguments(args);
      
      expect(options.sourceDir).toBe('/path/to/source');
      expect(options.skipSetup).toBe(true);
      expect(options.targetDir).toBe('');
      expect(options.verbosity).toBe(1);
      expect(options.showHelp).toBe(false);
    });

    it('should parse cores parameter when provided', () => {
      const args = ['/path/to/source', '--cores=4'];
      const options = parseArguments(args);
      
      expect(options.sourceDir).toBe('/path/to/source');
      expect(options.cores).toBe(4);
      expect(options.targetDir).toBe('');
      expect(options.verbosity).toBe(1);
      expect(options.skipSetup).toBe(false);
      expect(options.showHelp).toBe(false);
    });

    it('should ignore invalid cores parameter', () => {
      const args = ['/path/to/source', '--cores=invalid'];
      const options = parseArguments(args);
      
      expect(options.sourceDir).toBe('/path/to/source');
      expect(options.cores).toBeUndefined();
      expect(options.targetDir).toBe('');
      expect(options.verbosity).toBe(1);
      expect(options.skipSetup).toBe(false);
      expect(options.showHelp).toBe(false);
    });

    it('should parse target directory parameter when provided', () => {
      const args = ['/path/to/source', '--target=backup/daily'];
      const options = parseArguments(args);
      
      expect(options.sourceDir).toBe('/path/to/source');
      expect(options.targetDir).toBe('backup/daily');
      expect(options.verbosity).toBe(1);
      expect(options.skipSetup).toBe(false);
      expect(options.showHelp).toBe(false);
    });

    it('should parse WebDAV URL parameter when provided', () => {
      const args = ['/path/to/source', '--webdav-url=http://example.com'];
      const options = parseArguments(args);
      
      expect(options.sourceDir).toBe('/path/to/source');
      expect(options.webdavUrl).toBe('http://example.com');
      expect(options.targetDir).toBe('');
      expect(options.verbosity).toBe(1);
      expect(options.skipSetup).toBe(false);
      expect(options.showHelp).toBe(false);
    });

    it('should set showHelp flag when --help is provided', () => {
      const args = ['--help'];
      const options = parseArguments(args);
      
      expect(options.sourceDir).toBeNull();
      expect(options.showHelp).toBe(true);
      expect(options.targetDir).toBe('');
      expect(options.verbosity).toBe(1);
      expect(options.skipSetup).toBe(false);
    });

    it('should handle source directory with --help flag', () => {
      const args = ['/path/to/source', '--help'];
      const options = parseArguments(args);
      
      expect(options.sourceDir).toBeNull();
      expect(options.showHelp).toBe(true);
      expect(options.targetDir).toBe('');
      expect(options.verbosity).toBe(1);
      expect(options.skipSetup).toBe(false);
    });

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

    it('should handle missing source directory by defaulting to help', () => {
      const args = [];
      const options = parseArguments(args);
      
      expect(options.sourceDir).toBeNull();
      expect(options.showHelp).toBe(true);
      expect(options.targetDir).toBe('');
      expect(options.verbosity).toBe(1);
      expect(options.skipSetup).toBe(false);
    });
  });
}); 