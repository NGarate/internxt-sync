/**
 * Tests for FileScanner
 * 
 * To run these tests: bun test src/test/file-scanner.test.js
 */

import { expect, describe, it, beforeEach, spyOn, mock } from 'bun:test';
import FileScanner from '../core/file-scanner.js';
import * as fsUtils from '../utils/fs-utils.js';
import * as logger from '../utils/logger.js';
import fs from 'fs';
import path from 'path';

describe('FileScanner', () => {
  // Set up spies and mocks
  let calculateChecksumSpy;
  let loadJsonFromFileSpy;
  let saveJsonToFileSpy;
  let fsStatSyncSpy;
  let fsReaddirSyncSpy;
  let fsExistsSyncSpy;
  let loggerVerboseSpy;
  let loggerInfoSpy;
  let loggerErrorSpy;
  
  beforeEach(() => {
    // Create fresh spies for each test
    calculateChecksumSpy = spyOn(fsUtils, 'calculateChecksum');
    loadJsonFromFileSpy = spyOn(fsUtils, 'loadJsonFromFile');
    saveJsonToFileSpy = spyOn(fsUtils, 'saveJsonToFile');
    fsStatSyncSpy = spyOn(fs, 'statSync');
    fsReaddirSyncSpy = spyOn(fs, 'readdirSync');
    fsExistsSyncSpy = spyOn(fs, 'existsSync').mockImplementation(() => true);
    
    loggerVerboseSpy = spyOn(logger, 'verbose');
    loggerInfoSpy = spyOn(logger, 'info');
    loggerErrorSpy = spyOn(logger, 'error');
  });
  
  // Test constructor
  it('should create a FileScanner with the provided source directory', () => {
    // Mock path.resolve to return a predictable path
    const originalResolve = path.resolve;
    spyOn(path, 'resolve').mockImplementation((dir) => `/resolved${dir}`);
    
    const scanner = new FileScanner('/test/dir', 1);
    
    expect(scanner.sourceDir).toBe('/resolved/test/dir');
    expect(scanner.verbosity).toBe(1);
    expect(scanner.statePath).toContain('.internxt-upload-state.json');
    
    // Restore original path.resolve
    path.resolve = originalResolve;
  });
  
  // Test loadState
  it('should load state from file', async () => {
    const mockState = { 
      files: { 'file1.txt': 'checksum1', 'file2.txt': 'checksum2' }, 
      lastRun: '2023-01-01T00:00:00.000Z' 
    };
    
    loadJsonFromFileSpy.mockImplementation(() => Promise.resolve(mockState));
    
    const scanner = new FileScanner('/test/dir');
    await scanner.loadState();
    
    expect(scanner.uploadState).toEqual(mockState);
    expect(loadJsonFromFileSpy).toHaveBeenCalled();
  });
  
  // Test saveState
  it('should save state to file', async () => {
    saveJsonToFileSpy.mockImplementation(() => Promise.resolve(true));
    
    const scanner = new FileScanner('/test/dir');
    scanner.uploadState = { 
      files: { 'file1.txt': 'checksum1' }, 
      lastRun: '2023-01-01T00:00:00.000Z' 
    };
    
    await scanner.saveState();
    
    expect(saveJsonToFileSpy).toHaveBeenCalledWith(
      scanner.statePath,
      scanner.uploadState
    );
  });
  
  // Test updateFileState
  it('should update file state with new checksum', () => {
    const scanner = new FileScanner('/test/dir');
    scanner.updateFileState('file1.txt', 'new-checksum');
    
    expect(scanner.uploadState.files['file1.txt']).toBe('new-checksum');
  });
  
  // Test scanDirectory
  it('should scan directory and return file information', async () => {
    // Mock directory entries
    fsReaddirSyncSpy.mockImplementation(() => [
      { name: 'file1.txt', isDirectory: () => false, isFile: () => true },
      { name: 'subdir', isDirectory: () => true, isFile: () => false },
      { name: '.hidden', isDirectory: () => false, isFile: () => true } // Should be skipped
    ]);
    
    // Mock stats for file size
    fsStatSyncSpy.mockImplementation(() => ({ size: 1024 }));
    
    // Setup subdirectory content for recursive call
    fsReaddirSyncSpy.mockImplementationOnce(() => [
      { name: 'file1.txt', isDirectory: () => false, isFile: () => true },
      { name: 'subdir', isDirectory: () => true, isFile: () => false },
      { name: '.hidden', isDirectory: () => false, isFile: () => true }
    ]).mockImplementationOnce(() => [
      { name: 'file2.txt', isDirectory: () => false, isFile: () => true }
    ]);
    
    // Mock checksum calculation
    calculateChecksumSpy.mockImplementation(() => Promise.resolve('test-checksum'));
    
    const scanner = new FileScanner('/test/dir');
    const files = await scanner.scanDirectory('/test/dir');
    
    // Should have two files (file1.txt from root, file2.txt from subdir)
    // Hidden files and the state file should be skipped
    expect(files.length).toBe(2);
    expect(files[0].checksum).toBe('test-checksum');
    expect(files[0].size).toBe(1024);
  });
  
  // Test determineFilesToUpload
  it('should identify files that need to be uploaded', () => {
    const scanner = new FileScanner('/test/dir');
    scanner.uploadState = { 
      files: { 
        'unchanged.txt': 'same-checksum',
        'changed.txt': 'old-checksum'
      }
    };
    
    const allFiles = [
      { relativePath: 'unchanged.txt', checksum: 'same-checksum' },
      { relativePath: 'changed.txt', checksum: 'new-checksum' },
      { relativePath: 'new.txt', checksum: 'new-file-checksum' }
    ];
    
    const filesToUpload = scanner.determineFilesToUpload(allFiles);
    
    // Should include the changed file and the new file, but not the unchanged one
    expect(filesToUpload.length).toBe(2);
    expect(filesToUpload[0].relativePath).toBe('changed.txt');
    expect(filesToUpload[1].relativePath).toBe('new.txt');
  });
  
  // Test scan method - full scan flow
  it('should perform a complete scan process', async () => {
    // Mock the internal methods
    const scanner = new FileScanner('/test/dir');
    
    // Mock loadState
    loadJsonFromFileSpy.mockImplementation(() => Promise.resolve({
      files: { 'unchanged.txt': 'same-checksum' },
      lastRun: '2023-01-01T00:00:00.000Z'
    }));
    
    // Prepare test files with specific size
    const testFiles = [
      { 
        relativePath: 'unchanged.txt', 
        absolutePath: '/test/dir/unchanged.txt', 
        size: 1024, 
        checksum: 'same-checksum' 
      },
      { 
        relativePath: 'changed.txt', 
        absolutePath: '/test/dir/changed.txt', 
        size: 2048, 
        checksum: 'new-checksum' 
      }
    ];
    
    // Mock scanDirectory to return test files
    spyOn(scanner, 'scanDirectory').mockImplementation(() => Promise.resolve(testFiles));
    
    // Ensure only changed.txt is selected for upload
    const filesToUpload = [testFiles[1]]; // Only the changed file
    spyOn(scanner, 'determineFilesToUpload').mockImplementation(() => filesToUpload);
    
    const result = await scanner.scan();
    
    // Verify the result structure
    expect(result.allFiles.length).toBe(2);
    expect(result.filesToUpload.length).toBe(1);
    expect(result.filesToUpload[0].relativePath).toBe('changed.txt');
    expect(result.totalSizeBytes).toBe(2048);
    
    // Calculate the expected MB value manually for comparison
    const expectedMB = (2048 / (1024 * 1024)).toFixed(2);
    expect(result.totalSizeMB).toBe(expectedMB);
  });
}); 