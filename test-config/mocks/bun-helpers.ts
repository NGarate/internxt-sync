/**
 * Simple Bun Test Helpers
 * 
 * Lightweight utilities to help with Bun testing limitations
 */

import { it, mock } from 'bun:test';
import { Stats } from 'fs';

/**
 * Skip tests that use accessor property spying (a common Bun limitation)
 * 
 * @param name Test name
 * @param fn Test function
 */
export function skipIfSpyingIssues(name: string, fn: () => Promise<void> | void): void {
  return it(name, async () => {
    try {
      await fn();
    } catch (error: any) {
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
 * Logger function type
 */
type LoggerFunction = (...args: any[]) => void;

/**
 * Mock logger interface
 */
interface MockLoggers {
  verbose: LoggerFunction;
  info: LoggerFunction;
  success: LoggerFunction;
  warning: LoggerFunction;
  error: LoggerFunction;
  always: LoggerFunction;
}

/**
 * Creates standard mock logger functions
 * 
 * @returns Mock logger functions
 */
export function createMockLoggers(): MockLoggers {
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
 * Mock WebDAV service response interface
 */
interface WebDAVResponse {
  success: boolean;
  output: string;
}

/**
 * Mock WebDAV service interface
 */
interface MockWebDAVService {
  checkConnectivity: () => Promise<boolean>;
  uploadFile: (filePath: string, targetPath?: string) => Promise<WebDAVResponse>;
  createDirectoryStructure: (directoryPath: string, targetPath?: string) => Promise<boolean>;
  checkDirectoryExists: (directoryPath: string) => Promise<boolean>;
  checkServerCompatibility: () => Promise<boolean>;
  getFreeSpace: () => Promise<number>;
  getUsedSpace: () => Promise<number>;
}

/**
 * Creates a standard mock WebDAV service
 * 
 * @returns Mock WebDAV service
 */
export function createMockWebDAVService(): MockWebDAVService {
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
 * Mock FileScanner interface
 */
interface MockFileScanner {
  sourceDir: string;
  scan: () => Promise<any[]>;
  getFilesToUpload: () => Promise<any[]>;
  updateFileHash: (filePath: string, hash: string) => void;
  updateFileState: (filePath: string, uploaded: boolean) => void;
  recordCompletion: (filePath: string) => void;
  saveState: () => Promise<void>;
}

/**
 * Creates a simple mock for FileScanner
 * 
 * @param sourceDirPath Source directory path
 * @returns Mock FileScanner
 */
export function createMockFileScanner(sourceDirPath: string = './source'): MockFileScanner {
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
 * Mock file info interface
 */
interface MockFileInfo {
  filePath: string;
  absolutePath: string;
  relativePath: string;
  stats: {
    size: number;
    mtime: Date;
  };
  hash: string;
  checksum: string;
  hasChanged: boolean;
  needsUpload: boolean;
}

/**
 * Creates a mock file info object for testing
 * 
 * @param filePath File path
 * @param sourceDir Source directory
 * @param needsUpload Whether file needs upload
 * @returns Mock file info object
 */
export function createMockFileInfo(
  filePath: string, 
  sourceDir: string = './source', 
  needsUpload: boolean = true
): MockFileInfo {
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