/**
 * Logger utility for the Internxt WebDAV Uploader
 * Handles console output with color formatting and verbosity levels
 */

import chalk from 'chalk';

// Output verbosity levels
export const Verbosity = {
  Quiet: 0,  // Only errors and final summary
  Normal: 1, // Errors, summary, and key status updates
  Verbose: 2 // All messages including per-file operations
};

/**
 * Log a message with the specified verbosity level
 * @param {string} message - The message to log
 * @param {number} level - The verbosity level of the message
 * @param {number} currentVerbosity - The current verbosity setting
 */
export function log(message, level, currentVerbosity) {
  if (currentVerbosity >= level) {
    console.log(message);
  }
}

/**
 * Log an error message (always shown regardless of verbosity)
 * @param {string} message - The error message
 */
export function error(message) {
  console.error(chalk.red(message));
}

/**
 * Log a warning message
 * @param {string} message - The warning message
 * @param {number} currentVerbosity - The current verbosity setting
 */
export function warning(message, currentVerbosity) {
  log(chalk.yellow(message), Verbosity.Normal, currentVerbosity);
}

/**
 * Log an info message
 * @param {string} message - The info message
 * @param {number} currentVerbosity - The current verbosity setting
 */
export function info(message, currentVerbosity) {
  log(chalk.blue(message), Verbosity.Normal, currentVerbosity);
}

/**
 * Log a success message
 * @param {string} message - The success message
 * @param {number} currentVerbosity - The current verbosity setting
 */
export function success(message, currentVerbosity) {
  log(chalk.green(message), Verbosity.Normal, currentVerbosity);
}

/**
 * Log a verbose message (only shown in verbose mode)
 * @param {string} message - The verbose message
 * @param {number} currentVerbosity - The current verbosity setting
 */
export function verbose(message, currentVerbosity) {
  log(message, Verbosity.Verbose, currentVerbosity);
}

/**
 * Log a message that should always be shown regardless of verbosity
 * @param {string} message - The message to show
 */
export function always(message) {
  console.log(message);
} 