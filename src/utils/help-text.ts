/**
 * Help text utility for the WebDAV File Sync
 * Handles generation of command-line help documentation
 */

import { Verbosity } from '../interfaces/logger';
import { WebDAVConnectivityOptions, WebDAVServiceOptions, WebDAVClientOptions, UploadResult, DirectoryResult } from '../interfaces/webdav';
import { isBunEnvironment } from './env-utils';
import * as logger from './logger';

/**
 * Generate and display help text for the application
 */
export function showHelp() {
  // Get the correct file extension for examples based on the runtime
  const scriptExt = isBunEnvironment() ? '.ts' : '.js';
  const runtime = isBunEnvironment() ? 'bun' : 'node';
  
  logger.always(`
Usage: ${runtime} webdav-backup${scriptExt} <source-dir> [options]

Options:
  --cores=<number>   Number of concurrent uploads (default: 2/3 of CPU cores)
  --target=<path>    Target directory on the WebDAV server (default: root directory)
  --quiet            Show minimal output (only errors and the progress bar)
  --verbose          Show detailed output including per-file operations
  --force            Force upload all files regardless of whether they've changed
  --webdav-url=<url> WebDAV server URL (required)
  --help             Show this help message

Examples:
  ${runtime} webdav-backup${scriptExt} /path/to/files --webdav-url=https://example.com/webdav
  ${runtime} webdav-backup${scriptExt} /path/to/files --cores=4 --webdav-url=https://example.com/webdav
  ${runtime} webdav-backup${scriptExt} /path/to/files --target=backup/daily --webdav-url=https://example.com/webdav
  ${runtime} webdav-backup${scriptExt} /path/to/files --quiet --webdav-url=https://example.com/webdav
  ${runtime} webdav-backup${scriptExt} /path/to/files --force --webdav-url=https://example.com/webdav
  `);
}

/**
 * Generate and return help text as a string without displaying it
 * @returns {string} The help text
 */
export function getHelpText() {
  const scriptExt = isBunEnvironment() ? '.ts' : '.js';
  const runtime = isBunEnvironment() ? 'bun' : 'node';
  
  return `
Usage: ${runtime} webdav-backup${scriptExt} <source-dir> [options]

Options:
  --cores=<number>   Number of concurrent uploads (default: 2/3 of CPU cores)
  --target=<path>    Target directory on the WebDAV server (default: root directory)
  --quiet            Show minimal output (only errors and the progress bar)
  --verbose          Show detailed output including per-file operations
  --force            Force upload all files regardless of whether they've changed
  --webdav-url=<url> WebDAV server URL (required)
  --help             Show this help message

Examples:
  ${runtime} webdav-backup${scriptExt} /path/to/files --webdav-url=https://example.com/webdav
  ${runtime} webdav-backup${scriptExt} /path/to/files --cores=4 --webdav-url=https://example.com/webdav
  ${runtime} webdav-backup${scriptExt} /path/to/files --target=backup/daily --webdav-url=https://example.com/webdav
  ${runtime} webdav-backup${scriptExt} /path/to/files --quiet --webdav-url=https://example.com/webdav
  ${runtime} webdav-backup${scriptExt} /path/to/files --force --webdav-url=https://example.com/webdav
  `;
} 