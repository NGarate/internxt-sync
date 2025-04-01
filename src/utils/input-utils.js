/**
 * Input utilities for the Internxt WebDAV Uploader
 * Handles user input/prompt functionality
 */

import readline from 'readline';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

/**
 * Create readline interface for user input
 * @returns {readline.Interface} The readline interface
 */
export function createReadlineInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

/**
 * Get user input with prompt
 * @param {string} question - The prompt to display
 * @returns {Promise<string>} The user's input
 */
export async function promptUser(question) {
  const rl = createReadlineInterface();
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

/**
 * Get password input (not showing characters on supported platforms)
 * @param {string} question - The prompt to display
 * @returns {Promise<string>} The user's input
 */
export async function promptPassword(question) {
  // On Unix-like systems, we can use stty to hide input
  try {
    // Check if running on Unix-like system
    if (process.platform !== 'win32') {
      // Save current terminal settings
      await execAsync('stty -echo');
      
      const answer = await promptUser(question);
      
      // Restore terminal settings
      await execAsync('stty echo');
      
      // Add a newline since the terminal doesn't echo one
      console.log();
      
      return answer;
    }
  } catch (error) {
    // If stty fails, fall back to regular prompt
    console.log('Note: Password will be visible when typing');
  }
  
  // Fall back to regular prompt
  return promptUser(question);
}

/**
 * Parse command line arguments into an options object
 * @param {string[]} args - Command line arguments (usually process.argv.slice(2))
 * @returns {Object} Parsed options
 */
export function parseArguments(args) {
  // Default options
  const options = {
    sourceDir: null,
    verbosity: 1, // Normal verbosity
    cores: undefined, // Will be determined based on CPU cores
    targetDir: '',
    skipSetup: false,
    webdavUrl: undefined,
    showHelp: false
  };
  
  // Check for help flag or insufficient arguments
  if (args.length < 1 || args.includes("--help")) {
    options.showHelp = true;
    if (args.length >= 1 && !args.includes("--help")) {
      options.sourceDir = args[0];
    }
    return options;
  }

  // First non-flag argument is the source directory
  options.sourceDir = args[0];
  
  // Parse other flags and options
  if (args.includes("--quiet")) {
    options.verbosity = 0; // Quiet
  } else if (args.includes("--verbose")) {
    options.verbosity = 2; // Verbose
  }
  
  if (args.includes("--skip-setup")) {
    options.skipSetup = true;
  }
  
  for (const arg of args) {
    if (arg.startsWith('--cores=')) {
      const coreValue = parseInt(arg.split('=')[1], 10);
      if (!isNaN(coreValue) && coreValue > 0) {
        options.cores = coreValue;
      }
    } else if (arg.startsWith('--target=')) {
      options.targetDir = arg.substring('--target='.length);
    } else if (arg.startsWith('--webdav-url=')) {
      options.webdavUrl = arg.substring('--webdav-url='.length);
    }
  }
  
  return options;
} 