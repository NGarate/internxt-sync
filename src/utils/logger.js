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

// Set to track recent messages to avoid duplicates
const recentMessages = new Set();
const MAX_RECENT_MESSAGES = 10;
const DUPLICATE_TIMEOUT = 1000; // 1 second

/**
 * Clear old messages from the recent messages set
 */
function clearOldMessages() {
  if (recentMessages.size > MAX_RECENT_MESSAGES) {
    recentMessages.clear();
  }
  
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
    // Skip duplicate messages if not allowed
    if (!allowDuplicates && recentMessages.has(message)) {
      return;
    }
    
    // Add newline if needed and write to stdout
    if (!message.endsWith('\n')) {
      message += '\n';
    }
    process.stdout.write(message);
    
    // Track message to prevent duplicates if needed
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
  const formattedMessage = `❌ ${message}`;
  const output = formattedMessage.endsWith('\n') ? formattedMessage : formattedMessage + '\n';
  process.stderr.write(chalk.red(output));
}

/**
 * Log a warning message
 * @param {string} message - The warning message
 * @param {number} currentVerbosity - The current verbosity setting
 */
export function warning(message, currentVerbosity) {
  const formattedMessage = `⚠️ ${message}`;
  log(chalk.yellow(formattedMessage), Verbosity.Normal, currentVerbosity, false);
}

/**
 * Log an info message
 * @param {string} message - The info message
 * @param {number} currentVerbosity - The current verbosity setting
 */
export function info(message, currentVerbosity) {
  const formattedMessage = `ℹ️  ${message}`;
  log(chalk.blue(formattedMessage), Verbosity.Normal, currentVerbosity, false);
}

/**
 * Log a success message
 * @param {string} message - The success message
 * @param {number} currentVerbosity - The current verbosity setting
 */
export function success(message, currentVerbosity) {
  const formattedMessage = `✅ ${message}`;
  log(chalk.green(formattedMessage), Verbosity.Normal, currentVerbosity, true);
}

/**
 * Log a verbose message (only shown in verbose mode)
 * @param {string} message - The verbose message
 * @param {number} currentVerbosity - The current verbosity setting
 */
export function verbose(message, currentVerbosity) {
  log(message, Verbosity.Verbose, currentVerbosity, true);
}

/**
 * Log a message that should always be shown regardless of verbosity
 * @param {string} message - The message to show
 */
export function always(message) {
  const output = message.endsWith('\n') ? message : message + '\n';
  process.stdout.write(output);
} 