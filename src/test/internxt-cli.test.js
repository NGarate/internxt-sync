/**
 * Tests for Internxt CLI Manager
 * 
 * To run these tests: bun test src/test/internxt-cli.test.js
 */

import { expect, describe, it, beforeEach, afterEach } from 'bun:test';
import InternxtCLI from '../core/internxt-cli.js';
import * as logger from '../utils/logger.js';
import * as cliCommands from '../core/cli-commands.js';
import { spyOn, mockPromiseResult } from './test-utils.js';

describe('Internxt CLI Manager', () => {
  // Mock CLI command methods that are called by InternxtCLI
  let checkInstalledCommandSpy, installCommandSpy, checkLoggedInCommandSpy, 
      loginCommandSpy, checkWebDAVEnabledCommandSpy, enableWebDAVCommandSpy;
  
  // Mock logger methods
  let loggerSuccessSpy;
  
  beforeEach(() => {
    // Create spies on the cli-commands module functions
    checkInstalledCommandSpy = spyOn(cliCommands, 'checkInternxtInstalled');
    installCommandSpy = spyOn(cliCommands, 'installInternxtCLI');
    checkLoggedInCommandSpy = spyOn(cliCommands, 'checkLoggedIn');
    loginCommandSpy = spyOn(cliCommands, 'login');
    checkWebDAVEnabledCommandSpy = spyOn(cliCommands, 'checkWebDAVEnabled');
    enableWebDAVCommandSpy = spyOn(cliCommands, 'enableWebDAV');
    
    // Mock logger methods
    loggerSuccessSpy = spyOn(logger, 'success');
  });
  
  afterEach(() => {
    // Clean up all mocks
    checkInstalledCommandSpy.mockRestore();
    installCommandSpy.mockRestore();
    checkLoggedInCommandSpy.mockRestore();
    loginCommandSpy.mockRestore();
    checkWebDAVEnabledCommandSpy.mockRestore();
    enableWebDAVCommandSpy.mockRestore();
    if (loggerSuccessSpy) loggerSuccessSpy.mockRestore();
  });
  
  // Test constructor
  describe('constructor', () => {
    it('should initialize with default verbosity', () => {
      const cli = new InternxtCLI();
      
      expect(cli.verbosity).toBe(logger.Verbosity.Normal);
      expect(cli.config).toEqual({
        isInstalled: false,
        isLoggedIn: false,
        webdavEnabled: false,
        webdavUrl: null
      });
    });
    
    it('should initialize with specified verbosity', () => {
      const cli = new InternxtCLI(logger.Verbosity.Verbose);
      
      expect(cli.verbosity).toBe(logger.Verbosity.Verbose);
    });
  });
  
  // Test checkInstalled
  describe('checkInstalled', () => {
    it('should return true when CLI is installed', async () => {
      // Mock the CLI command to return installed=true
      checkInstalledCommandSpy.mockImplementation(() => 
        mockPromiseResult({ installed: true, version: '1.0.0' }));
      
      const cli = new InternxtCLI();
      const result = await cli.checkInstalled();
      
      expect(result).toBe(true);
      expect(cli.config.isInstalled).toBe(true);
      expect(checkInstalledCommandSpy).toHaveBeenCalledWith(logger.Verbosity.Normal);
    });
    
    it('should return false when CLI is not installed', async () => {
      // Mock the CLI command to return installed=false
      checkInstalledCommandSpy.mockImplementation(() => 
        mockPromiseResult({ installed: false, version: null }));
      
      const cli = new InternxtCLI();
      const result = await cli.checkInstalled();
      
      expect(result).toBe(false);
      expect(cli.config.isInstalled).toBe(false);
      expect(checkInstalledCommandSpy).toHaveBeenCalledWith(logger.Verbosity.Normal);
    });
  });
  
  // Test install
  describe('install', () => {
    it('should return true and update config when installation succeeds', async () => {
      // Mock the CLI command to return true (success)
      installCommandSpy.mockImplementation(() => mockPromiseResult(true));
      
      const cli = new InternxtCLI();
      const result = await cli.install();
      
      expect(result).toBe(true);
      expect(cli.config.isInstalled).toBe(true);
      expect(installCommandSpy).toHaveBeenCalledWith(logger.Verbosity.Normal);
    });
    
    it('should return false and not update config when installation fails', async () => {
      // Mock the CLI command to return false (failure)
      installCommandSpy.mockImplementation(() => mockPromiseResult(false));
      
      const cli = new InternxtCLI();
      const result = await cli.install();
      
      expect(result).toBe(false);
      expect(cli.config.isInstalled).toBe(false);
      expect(installCommandSpy).toHaveBeenCalledWith(logger.Verbosity.Normal);
    });
  });
  
  // Test getWebDAVUrl
  describe('getWebDAVUrl', () => {
    it('should return the WebDAV URL from config', () => {
      const cli = new InternxtCLI();
      cli.config.webdavUrl = 'http://webdav.example.com';
      
      expect(cli.getWebDAVUrl()).toBe('http://webdav.example.com');
    });
    
    it('should return null if WebDAV URL is not set', () => {
      const cli = new InternxtCLI();
      
      expect(cli.getWebDAVUrl()).toBeNull();
    });
  });
  
  // Test setWebDAVUrl
  describe('setWebDAVUrl', () => {
    it('should set the WebDAV URL and enabled flag', () => {
      const cli = new InternxtCLI();
      cli.setWebDAVUrl('http://custom.webdav.example.com');
      
      expect(cli.config.webdavUrl).toBe('http://custom.webdav.example.com');
      expect(cli.config.webdavEnabled).toBe(true);
    });
  });
}); 