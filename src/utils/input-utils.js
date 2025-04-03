/**
 * Input utilities for the Internxt WebDAV Uploader
 * Handles user input/prompt functionality
 */

import readline from 'readline';
import { promisify } from 'util';
import { exec } from 'child_process';
import { createInterface } from 'readline';
import { Writable } from 'stream';
import { spawnSync } from 'child_process';
import { isBunEnvironment } from './env-utils.js';

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
 * Get password input (not showing characters on all platforms)
 * @param {string} question - The prompt to display
 * @returns {Promise<string>} The user's input
 */
export async function promptPassword(question) {
  return getSecurePassword(question);
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

/**
 * Secure password input utility
 * Ensures passwords are not visible when typed on any platform
 */

/**
 * Gets a password from the user without displaying it on screen
 * Works on Windows, macOS, and Linux
 * 
 * @param {string} prompt - The prompt to display to the user
 * @returns {Promise<string>} - The password entered by the user
 */
export async function getSecurePassword(prompt) {
  // For Windows, we need a special approach
  if (process.platform === 'win32') {
    return getSecurePasswordWindows(prompt);
  }
  
  // For Unix-like systems (macOS, Linux)
  try {
    // Display the prompt
    process.stdout.write(`${prompt}: `);
    
    // Disable terminal echo
    spawnSync('stty', ['-echo'], { stdio: 'inherit' });
    
    // Get the password
    const rl = createReadlineInterface();
    const password = await new Promise((resolve) => {
      rl.question('', (answer) => {
        resolve(answer);
        rl.close();
      });
    });
    
    // Re-enable terminal echo and add a newline
    spawnSync('stty', ['echo'], { stdio: 'inherit' });
    console.log();
    
    return password;
  } catch (error) {
    // If stty fails, ensure echo is back on and fall back to basic method
    try {
      spawnSync('stty', ['echo'], { stdio: 'inherit' });
    } catch (e) {
      // Ignore errors when trying to restore echo
    }
    
    console.warn('Warning: Secure password input not available. Your password may be visible.');
    return promptUser(`${prompt} (warning: may be visible): `);
  }
}

/**
 * Gets a password securely on Windows
 * 
 * @param {string} prompt - The prompt to display to the user
 * @returns {Promise<string>} - The password entered by the user
 */
async function getSecurePasswordWindows(prompt) {
  try {
    // Create a custom output stream that doesn't display the password
    const mutableStdout = new Writable({
      write: function(chunk, encoding, callback) {
        // Don't write the password to stdout
        if (!this.muted) {
          process.stdout.write(chunk, encoding);
        }
        callback();
      }
    });
    
    mutableStdout.muted = false;
    
    const rl = createInterface({
      input: process.stdin,
      output: mutableStdout,
      terminal: true
    });
    
    // Display the prompt and wait for the interface to be ready
    process.stdout.write(`${prompt}: `);
    
    // Give the interface a moment to initialize
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Mute the output while the password is being typed
    mutableStdout.muted = true;
    
    // Get the password with robust error handling and timeout
    const password = await new Promise((resolve, reject) => {
      // Keep track of whether we've resolved already
      let hasResolved = false;
      
      const cleanup = () => {
        if (!rl.closed) {
          rl.close();
        }
      };
      
      // Handle the password input
      rl.question('', (answer) => {
        if (hasResolved) return;
        hasResolved = true;
        
        // Add a newline since the user's Enter key won't do it when muted
        process.stdout.write('\n');
        cleanup();
        resolve(answer);
      });
      
      // Handle potential errors
      rl.on('error', (error) => {
        if (hasResolved) return;
        hasResolved = true;
        
        process.stdout.write('\n');
        cleanup();
        reject(error);
      });
      
      // Handle SIGINT (Ctrl+C)
      rl.on('SIGINT', () => {
        if (hasResolved) return;
        hasResolved = true;
        
        process.stdout.write('\n');
        cleanup();
        reject(new Error('Password input canceled'));
      });
      
      // Set a timeout to handle scenarios where the interface might be blocking
      setTimeout(() => {
        if (hasResolved) return;
        hasResolved = true;
        
        process.stdout.write('\n');
        cleanup();
        resolve('');
      }, 15000); // 15-second timeout (shorter to avoid hanging)
    });
    
    return password;
  } catch (error) {
    // If the custom method fails, fall back to a basic approach
    console.warn('Warning: Secure password input not available. Your password may be visible.');
    return promptUser(`${prompt} (warning: may be visible): `);
  }
}

/**
 * Prompts the user for credentials with secure password input
 * 
 * @param {string} usernamePrompt - The prompt for the username
 * @param {string} passwordPrompt - The prompt for the password
 * @returns {Promise<{username: string, password: string}>} - The credentials
 */
export async function getCredentials(usernamePrompt = 'Username', passwordPrompt = 'Password') {
  // Get username (visible)
  const username = await promptUser(`${usernamePrompt}: `);
  
  // Get password (hidden)
  const password = await getSecurePassword(passwordPrompt);
  
  return { username, password };
} 