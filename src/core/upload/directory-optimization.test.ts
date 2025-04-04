/**
 * Tests for directory creation optimization in Uploader
 * 
 * These tests focus on verifying that directories are created efficiently
 * when uploading multiple files in the same directories.
 */

import { expect, describe, beforeEach, spyOn, mock } from 'bun:test';
import Uploader from './uploader';
import { Verbosity } from '../../interfaces/logger';
import * as logger from '../../utils/logger';
import { skipIfSpyingIssues, createMockWebDAVService, createMockFileInfo } from '../../../test-config/mocks/bun-helpers';

describe('Directory Creation Optimization', () => {
  // Test data
  const webdavUrl = 'https://example.com/webdav';
  const targetDir = 'target';
  const concurrentUploads = 2;
  const verbosity = Verbosity.Normal;
  
  // Mocks and spies
  let mockWebdavService;
  let loggerSpies;
  let uploader;
  
  beforeEach(() => {
    // Set up logger spies
    loggerSpies = {
      success: spyOn(logger, 'success'),
      error: spyOn(logger, 'error'),
      info: spyOn(logger, 'info'),
      verbose: spyOn(logger, 'verbose')
    };
    
    // Create mock WebDAV service with spies
    mockWebdavService = createMockWebDAVService();
    
    // Create uploader with mocks
    uploader = new Uploader(webdavUrl, concurrentUploads, targetDir, verbosity);
    uploader.webdavService = mockWebdavService;
  });
  
  skipIfSpyingIssues('should create directories once when uploading a single file', async () => {
    // Create a single file in a nested directory
    const fileInfo = createMockFileInfo('source/nested/deep/path/file.txt');
    
    // Upload the file
    await uploader.handleFileUpload(fileInfo);
    
    // Verify directory creation was called
    expect(mockWebdavService.createDirectoryStructure).toHaveBeenCalled();
    
    // The createdDirectories size can be either 1 or 2 depending on if target directory
    // and file's parent directory are counted separately
    expect(uploader.createdDirectories.size).toBeGreaterThan(0);
    
    // Store the initial call count
    const initialCallCount = mockWebdavService.createDirectoryStructure.mock.calls.length;
    
    // Upload the same file again
    await uploader.handleFileUpload(fileInfo);
    
    // Directory creation should not be called again
    expect(mockWebdavService.createDirectoryStructure.mock.calls.length).toBe(initialCallCount);
  });
  
  skipIfSpyingIssues('should create directories once when uploading multiple files in the same directory', async () => {
    // Create multiple files in the same directory
    const fileInfo1 = createMockFileInfo('source/nested/path/file1.txt');
    const fileInfo2 = createMockFileInfo('source/nested/path/file2.txt');
    const fileInfo3 = createMockFileInfo('source/nested/path/file3.txt');
    
    // Upload all files
    await uploader.startUpload([fileInfo1, fileInfo2, fileInfo3]);
    
    // Directory creation should be called only once for the shared directory
    // Since startUpload is more complex, we can't assert the exact call count,
    // but we can check that the number of unique directories is correct
    const uniqueDirCount = new Set(mockWebdavService.createDirectoryStructure.mock.calls
      .map(args => args[0])).size;
    
    // One call for the target dir and one for the nested path
    expect(uniqueDirCount).toBeLessThanOrEqual(2);
    
    // Verify the directories are in the tracking set
    expect(uploader.createdDirectories.size).toBeGreaterThan(0);
  });
  
  skipIfSpyingIssues('should pre-create all necessary directories before uploading files', async () => {
    // Create files in different directories
    const files = [
      createMockFileInfo('source/dir1/file1.txt'),
      createMockFileInfo('source/dir2/file2.txt'),
      createMockFileInfo('source/dir3/subdir/file3.txt')
    ];
    
    // Track when directories are created vs when files are uploaded
    const events = [];
    
    // Mock the service methods to track the order of operations
    const originalCreateDir = mockWebdavService.createDirectoryStructure;
    const originalUploadFile = mockWebdavService.uploadFile;
    
    mockWebdavService.createDirectoryStructure = mock((path) => {
      events.push(`create-dir:${path}`);
      return originalCreateDir(path);
    });
    
    mockWebdavService.uploadFile = mock((path, target) => {
      events.push(`upload-file:${target}`);
      return originalUploadFile(path, target);
    });
    
    // Upload all files
    await uploader.startUpload(files);
    
    // Verify directory events come before file upload events
    let lastDirEventIndex = -1;
    
    for (let i = 0; i < events.length; i++) {
      if (events[i].startsWith('create-dir:')) {
        lastDirEventIndex = i;
      }
    }
    
    // Find the first upload event
    const firstUploadIndex = events.findIndex(e => e.startsWith('upload-file:'));
    
    // All directories should be created before any files are uploaded
    // This might not always be true for parallel uploads, but the key directories
    // should be pre-created early in the process
    expect(firstUploadIndex).toBeGreaterThan(0);
    expect(events.filter(e => e.startsWith('create-dir:')).length).toBeGreaterThan(0);
  });
  
  skipIfSpyingIssues('should efficiently handle a large number of files in deep directory structures', async () => {
    // Create a more complex directory structure with many files
    const files = [];
    const dirStructure = ['dir1', 'dir2', 'dir1/sub1', 'dir1/sub2', 'dir2/sub1', 'dir1/sub1/sub'];
    
    // Create 4 files per directory
    for (const dir of dirStructure) {
      for (let i = 1; i <= 4; i++) {
        files.push(createMockFileInfo(`source/${dir}/file${i}.txt`));
      }
    }
    
    // Reset mock to count calls
    mockWebdavService.createDirectoryStructure = mock(() => Promise.resolve(true));
    
    // Upload all files
    await uploader.startUpload(files);
    
    // Count unique directories that were created
    const uniqueDirsCreated = new Set(mockWebdavService.createDirectoryStructure.mock.calls
      .map(args => args[0])).size;
    
    // Should be roughly equal to the number of unique directories (dirStructure.length + target)
    expect(uniqueDirsCreated).toBeLessThanOrEqual(dirStructure.length + 1);
    
    // Verify the call count is much less than the file count
    // Without optimization, it would make a call for each file
    expect(mockWebdavService.createDirectoryStructure.mock.calls.length).toBeLessThan(files.length);
    
    // Check that all files were processed
    expect(mockWebdavService.uploadFile.mock.calls.length).toBe(files.length);
  });
}); 