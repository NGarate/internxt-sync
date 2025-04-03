// This file was modified to test the upload process
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

// Maintain a log of recent messages to prevent duplicates
const recentMessages = new Set();
const MAX_RECENT_MESSAGES = 10;
const DUPLICATE_TIMEOUT = 1000; // 1 second

/**
 * Clear old messages from the recent messages set
 */
function clearOldMessages() {
  if (recentMessages.size > MAX_RECENT_MESSAGES) {
    // Clear all messages if we exceed the limit
    recentMessages.clear();
  }
  
  // Clear all messages after a timeout
  setTimeout(() => {
    recentMessages.clear();
  }, DUPLICATE_TIMEOUT);
}

/**
 * Log a message with the specified verbosity level
 * @param {string} message - The message to log
 * @param {number} level - The verbosity level of the message
 * @param {number} currentVerbosity - The current verbosity setting
 * @param {boolean} allowDuplicates - Whether to allow duplicate messages
 */
export function log(message, level, currentVerbosity, allowDuplicates = true) {
  if (currentVerbosity >= level) {
    // Check if this is a duplicate message
    if (!allowDuplicates && recentMessages.has(message)) {
      return;
    }
    
    console.log(message);
    
    // Add to recent messages if not allowing duplicates
    if (!allowDuplicates) {
      recentMessages.add(message);
      clearOldMessages();
    }
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
  log(chalk.yellow(message), Verbosity.Normal, currentVerbosity, false);
}

/**
 * Log an info message
 * @param {string} message - The info message
 * @param {number} currentVerbosity - The current verbosity setting
 */
export function info(message, currentVerbosity) {
  log(chalk.blue(message), Verbosity.Normal, currentVerbosity, false);
}

/**
 * Log a success message
 * @param {string} message - The success message
 * @param {number} currentVerbosity - The current verbosity setting
 */
export function success(message, currentVerbosity) {
  log(chalk.green(message), Verbosity.Normal, currentVerbosity, true);
}

/**
 * Log a verbose message (only shown in verbose mode)
 * @param {string} message - The verbose message
 * @param {number} currentVerbosity - The current verbosity setting
 */
export function verbose(message, currentVerbosity) {
  // For verbose messages, we always allow duplicates as they might contain
  // different dynamic content but similar static content
  log(message, Verbosity.Verbose, currentVerbosity, true);
}

/**
 * Log a message that should always be shown regardless of verbosity
 * @param {string} message - The message to show
 */
export function always(message) {
  console.log(message);
} 