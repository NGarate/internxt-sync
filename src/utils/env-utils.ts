/**
 * Environment utilities for the WebDAV Backup Tool
 * Handles system capabilities for Bun runtime
 */

import os from 'os';

/**
 * Get the optimal number of concurrent uploads based on available CPU cores
 * @param {number} [userSpecified] - User specified number of cores (optional)
 * @returns {number} Optimal number of concurrent uploads
 */
export function getOptimalConcurrency(userSpecified?: number): number {
  if (userSpecified && !isNaN(userSpecified) && userSpecified > 0) {
    return userSpecified;
  }
  
  // Get the total number of CPU cores
  const totalCores = os.cpus().length;
  
  // Default to 2/3 of available cores, minimum 1
  return Math.max(1, Math.floor(totalCores * (2/3)));
}

/**
 * Get version information for runtime environment
 * @returns {Object} Object containing version information
 */
export function getVersionInfo() {
  return {
    bunVersion: Bun.version,
    platform: process.platform,
    arch: process.arch
  };
}

/**
 * Detects if the current runtime environment is Bun
 * @returns {boolean} true if running in Bun, false if running in Node.js
 */
export function isBunEnvironment(): boolean {
  return typeof process !== 'undefined' && 
    typeof process.versions !== 'undefined' && 
    typeof process.versions.bun !== 'undefined';
} 