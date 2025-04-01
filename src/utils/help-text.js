/**
 * Help text utility for the Internxt Sync
 * Handles generation of command-line help documentation
 */

import { isBunEnvironment } from './env-utils.js';
import * as logger from './logger.js';

/**
 * Generate and display help text for the application
 */
export function showHelp() {
  // Get the correct file extension for examples based on the runtime
  const scriptExt = isBunEnvironment() ? '.ts' : '.js';
  const runtime = isBunEnvironment() ? 'bun' : 'node';
  
  logger.always(`
Usage: ${runtime} internxt-sync${scriptExt} <source-dir> [options]

Options:
  --cores=<number>   Number of concurrent uploads (default: 2/3 of CPU cores)
  --target=<path>    Target directory on Internxt (default: root directory)
  --quiet            Show minimal output (only errors and the progress bar)
  --verbose          Show detailed output including per-file operations
  --skip-setup       Skip the full setup process (still checks WebDAV status)
  --webdav-url=<url> Use a specific WebDAV URL (optional, can be auto-detected)
  --help             Show this help message

Examples:
  ${runtime} internxt-sync${scriptExt} /path/to/files
  ${runtime} internxt-sync${scriptExt} /path/to/files --cores=4
  ${runtime} internxt-sync${scriptExt} /path/to/files --target=backup/daily
  ${runtime} internxt-sync${scriptExt} /path/to/files --quiet
  ${runtime} internxt-sync${scriptExt} /path/to/files --skip-setup
  ${runtime} internxt-sync${scriptExt} /path/to/files --skip-setup --webdav-url=http://webdav.local.internxt.com:3005
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
Usage: ${runtime} internxt-sync${scriptExt} <source-dir> [options]

Options:
  --cores=<number>   Number of concurrent uploads (default: 2/3 of CPU cores)
  --target=<path>    Target directory on Internxt (default: root directory)
  --quiet            Show minimal output (only errors and the progress bar)
  --verbose          Show detailed output including per-file operations
  --skip-setup       Skip the full setup process (still checks WebDAV status)
  --webdav-url=<url> Use a specific WebDAV URL (optional, can be auto-detected)
  --help             Show this help message

Examples:
  ${runtime} internxt-sync${scriptExt} /path/to/files
  ${runtime} internxt-sync${scriptExt} /path/to/files --cores=4
  ${runtime} internxt-sync${scriptExt} /path/to/files --target=backup/daily
  ${runtime} internxt-sync${scriptExt} /path/to/files --quiet
  ${runtime} internxt-sync${scriptExt} /path/to/files --skip-setup
  ${runtime} internxt-sync${scriptExt} /path/to/files --skip-setup --webdav-url=http://webdav.local.internxt.com:3005
  `;
} 