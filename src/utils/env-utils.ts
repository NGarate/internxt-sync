import { WebDAVConnectivityOptions, WebDAVServiceOptions, WebDAVClientOptions, UploadResult, DirectoryResult } from '../interfaces/webdav';
/**
 * Environment utilities for the Internxt WebDAV Uploader
 * Handles runtime detection and system information
 */

import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Detect if running in Bun environment
 * @returns {boolean} True if running in Bun
 */
export function isBunEnvironment() {
  return typeof process !== 'undefined' && 
         typeof process.versions !== 'undefined' && 
         typeof process.versions.bun !== 'undefined';
}

/**
 * Get the optimal number of concurrent uploads based on available CPU cores
 * @param {number} [userSpecified] - User specified number of cores (optional)
 * @returns {number} Optimal number of concurrent uploads
 */
export function getOptimalConcurrency(userSpecified) {
  if (userSpecified && !isNaN(userSpecified) && userSpecified > 0) {
    return userSpecified;
  }
  
  // Get the total number of CPU cores
  const totalCores = os.cpus().length;
  
  // Default to 2/3 of available cores, minimum 1
  return Math.max(1, Math.floor(totalCores * (2/3)));
}

/**
 * Check if a command is available in the path
 * @param {string} command - The command to check
 * @returns {Promise<boolean>} True if the command is available
 */
export async function isCommandAvailable(command) {
  try {
    const checkCmd = process.platform === 'win32' 
      ? `where ${command}`
      : `which ${command}`;
    
    await execAsync(checkCmd);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get version information for runtime environment
 * @returns {Object} Object containing version information
 */
export function getVersionInfo() {
  const info = {
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    isBun: isBunEnvironment()
  };
  
  if (info.isBun) {
    info.bunVersion = process.versions.bun;
  }
  
  return info;
} 