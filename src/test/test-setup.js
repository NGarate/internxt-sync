/**
 * Test Setup for Internxt WebDAV Uploader
 * 
 * This file provides common setup and utility functions for tests.
 */

import { spyOn } from 'bun:test';

/**
 * Creates a spy on a method that properly handles async functions
 * 
 * @param {object} obj - The object containing the method to spy on
 * @param {string} method - The name of the method to spy on
 * @returns {function} The spy function
 */
export function createSpy(obj, method) {
  const original = obj[method];
  const spy = spyOn(obj, method);
  
  // Store the original method for restoration
  spy.originalMethod = original;
  
  // Add a restore method
  spy.mockRestore = function() {
    obj[method] = original;
  };
  
  return spy;
}

/**
 * Creates a mock for fs.statSync that returns a file stat object
 * 
 * @param {boolean} isDirectory - Whether the stat should represent a directory
 * @param {number} size - The size of the file in bytes
 * @param {Date} mtime - The modification time
 * @returns {object} A mock stat object
 */
export function createMockStat(isDirectory = false, size = 1024, mtime = new Date()) {
  return {
    isDirectory: () => isDirectory,
    isFile: () => !isDirectory,
    size: size,
    mtime: mtime
  };
}

/**
 * Sets up common mocks for file system operations
 * 
 * @param {object} fs - The fs module
 * @param {object} path - The path module
 * @returns {object} An object containing all the spies
 */
export function setupFsMocks(fs, path) {
  const spies = {
    existsSync: spyOn(fs, 'existsSync').mockImplementation(() => true),
    statSync: spyOn(fs, 'statSync').mockImplementation(() => createMockStat(false)),
    readdirSync: spyOn(fs, 'readdirSync').mockImplementation(() => []),
    resolve: spyOn(path, 'resolve').mockImplementation((dir) => `/resolved${dir}`)
  };
  
  return spies;
} 