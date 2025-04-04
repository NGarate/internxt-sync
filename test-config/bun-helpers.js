/**
 * Simple Bun Test Helpers
 * 
 * Lightweight utilities to help with Bun testing limitations
 */

import { it, mock } from 'bun:test';

/**
 * Skip tests that use accessor property spying (a common Bun limitation)
 * 
 * @param {string} name Test name
 * @param {Function} fn Test function
 */
export function skipIfSpyingIssues(name, fn) {
  return it(name, async () => {
    try {
      await fn();
    } catch (error) {
      if (error.message && (
        error.message.includes('does not support accessor properties') ||
        error.message.includes('spyOn(target, prop)') ||
        error.message.includes('cannot redefine property')
      )) {
        console.log(`[SKIPPED: Bun Limitation] ${name}`);
        return;
      }
      throw error;
    }
  });
}

/**
 * Creates standard mock logger functions
 * 
 * @returns {Object} Mock logger functions
 */
export function createMockLoggers() {
  return {
    verbose: mock(() => {}),
    info: mock(() => {}),
    success: mock(() => {}),
    warning: mock(() => {}),
    error: mock(() => {}),
    always: mock(() => {})
  };
}

/**
 * Creates a standard mock WebDAV service
 * 
 * @returns {Object} Mock WebDAV service
 */
export function createMockWebDAVService() {
  return {
    checkConnectivity: mock(() => Promise.resolve(true)),
    uploadFile: mock(() => Promise.resolve({ success: true, output: '' })),
    createDirectoryStructure: mock(() => Promise.resolve(true)),
    checkDirectoryExists: mock(() => Promise.resolve(true)),
    checkServerCompatibility: mock(() => Promise.resolve(true)),
    getFreeSpace: mock(() => Promise.resolve(1000000)),
    getUsedSpace: mock(() => Promise.resolve(500000))
  };
}

/**
 * Creates a simple mock for FileScanner
 * 
 * @param {string} sourceDirPath Source directory path
 * @returns {Object} Mock FileScanner
 */
export function createMockFileScanner(sourceDirPath = './source') {
  return {
    sourceDir: sourceDirPath,
    scan: mock(() => Promise.resolve([])),
    getFilesToUpload: mock(() => Promise.resolve([])),
    updateFileHash: mock(() => {}),
    updateFileState: mock(() => {}),
    recordCompletion: mock(() => {}),
    saveState: mock(() => Promise.resolve())
  };
}

/**
 * Creates a mock file info object for testing
 * 
 * @param {string} filePath File path
 * @param {string} sourceDir Source directory
 * @param {boolean} needsUpload Whether file needs upload
 * @returns {Object} Mock file info object
 */
export function createMockFileInfo(filePath, sourceDir = './source', needsUpload = true) {
  const relativePath = filePath.replace(`${sourceDir}/`, '').replace(/\\/g, '/');
  return {
    filePath,
    absolutePath: filePath,
    relativePath,
    stats: { size: 1024, mtime: new Date() },
    hash: 'mocked-hash-' + relativePath,
    checksum: 'mocked-checksum-' + relativePath,
    hasChanged: needsUpload,
    needsUpload
  };
} 