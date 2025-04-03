import { Verbosity } from '../interfaces/logger.js';
/**
 * Command runner utility
 * Handles CLI command execution with robust error handling
 */

import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import * as logger from './logger.js';

const execAsync = promisify(exec);

/**
 * Run a command asynchronously
 * @param {string} command - Command to execute
 * @param {object} options - Options for exec
 * @param {number} verbosity - Verbosity level for logging
 * @returns {Promise<object>} Command result with stdout and stderr
 */
export async function runCommand(command, options = {}, verbosity = logger.Verbosity.Normal) {
  try {
    // Only log if not quiet mode
    if (verbosity > logger.Verbosity.Quiet) {
      logger.verbose(`Running command: ${command}`, verbosity);
    }
    
    // Handle stdin input if provided in options
    if (options.input) {
      // When input is provided, we need to use spawn instead of exec
      // to properly handle stdin
      const parts = command.split(/\s+/);
      const cmd = parts[0];
      const args = parts.slice(1);
      
      return new Promise((resolve, reject) => {
        const child = spawn(cmd, args, {
          ...options,
          stdio: ['pipe', 'pipe', 'pipe']
        });
        
        let stdout = '';
        let stderr = '';
        
        child.stdout.on('data', (data) => {
          stdout += data.toString();
        });
        
        child.stderr.on('data', (data) => {
          stderr += data.toString();
        });
        
        child.on('error', (error) => {
          reject(error);
        });
        
        child.on('close', (code) => {
          if (code === 0) {
            resolve({ stdout, stderr });
          } else {
            const error = new Error(`Command failed with exit code ${code}`);
            error.code = code;
            error.stdout = stdout;
            error.stderr = stderr;
            reject(error);
          }
        });
        
        // Write the input to stdin
        child.stdin.write(options.input);
        child.stdin.end();
      });
    } else {
      // Standard exec for commands without stdin input
      const result = await execAsync(command, options);
      return result;
    }
  } catch (error) {
    if (verbosity > logger.Verbosity.Quiet) {
      logger.verbose(`Command failed: ${command}`, verbosity);
    }
    throw error;
  }
}

/**
 * Execute a command with fallback
 * @param {string} primaryCommand - Primary command to try first
 * @param {string} fallbackCommand - Fallback command to try if primary fails
 * @param {object} options - Options for exec
 * @param {number} verbosity - Verbosity level for logging
 * @returns {Promise<object>} Command result with stdout and stderr, or null if both fail
 */
export async function runCommandWithFallback(primaryCommand, fallbackCommand, options = {}, verbosity = logger.Verbosity.Normal) {
  try {
    // Only log if not quiet mode
    if (verbosity > logger.Verbosity.Quiet) {
      logger.verbose(`Trying primary command: ${primaryCommand}`, verbosity);
    }
    return await runCommand(primaryCommand, options, verbosity);
  } catch (primaryError) {
    if (verbosity > logger.Verbosity.Quiet) {
      logger.verbose(`Trying fallback command`, verbosity);
    }
    try {
      return await runCommand(fallbackCommand, options, verbosity);
    } catch (fallbackError) {
      if (verbosity > logger.Verbosity.Quiet) {
        logger.verbose(`All commands failed`, verbosity);
      }
      return null;
    }
  }
}

/**
 * Create an interactive process
 * @param {string} command - Command to run
 * @param {string[]} args - Command arguments
 * @param {object} options - Spawn options
 * @param {number} verbosity - Verbosity level for logging
 * @returns {object} Process object
 */
export function createInteractiveProcess(command, args, options = {}, verbosity = logger.Verbosity.Normal) {
  try {
    if (verbosity > logger.Verbosity.Quiet) {
      logger.verbose(`Starting process: ${command}`, verbosity);
    }
    return spawn(command, args, { stdio: ["pipe", "pipe", "pipe"], ...options });
  } catch (error) {
    if (verbosity > logger.Verbosity.Quiet) {
      logger.verbose(`Failed to start process`, verbosity);
    }
    throw error;
  }
}

/**
 * Creates an interactive process with fallback options
 * @param {string} primaryCommand - Primary command to run
 * @param {string[]} primaryArgs - Arguments for primary command
 * @param {string} fallbackCommand - Fallback command to run
 * @param {string[]} fallbackArgs - Arguments for fallback command
 * @param {object} options - Process options
 * @param {number} verbosity - Verbosity level
 * @param {object} [secondFallback] - Optional second fallback {command: string, args: string[]}
 * @returns {ChildProcess|null} The created process or null if all attempts fail
 */
export function createInteractiveProcessWithFallback(
  primaryCommand,
  primaryArgs,
  fallbackCommand,
  fallbackArgs,
  options = {},
  verbosity,
  secondFallback = null
) {
  // Cache successful command to avoid redundant attempts in the future
  // Using module-level variables instead of static variables
  if (!global.lastSuccessfulCommand) {
    global.lastSuccessfulCommand = null;
    global.lastSuccessfulArgs = null;
  }
  
  // First try the last successful command if available
  if (global.lastSuccessfulCommand) {
    try {
      const cachedProcess = spawn(global.lastSuccessfulCommand, global.lastSuccessfulArgs, options);
      if (cachedProcess.pid) {
        return cachedProcess;
      }
    } catch (error) {
      // If cached command fails, continue with normal flow
      if (verbosity > logger.Verbosity.Quiet) {
        logger.verbose(`Cached command failed, trying others`, verbosity);
      }
    }
  }

  try {
    // Try primary command first
    if (verbosity > logger.Verbosity.Quiet) {
      logger.verbose(`Trying primary command`, verbosity);
    }
    const process = spawn(primaryCommand, primaryArgs, options);
    if (process.pid) {
      // Cache successful command
      global.lastSuccessfulCommand = primaryCommand;
      global.lastSuccessfulArgs = primaryArgs;
      return process;
    }
  } catch (error) {
    if (verbosity > logger.Verbosity.Quiet) {
      logger.verbose(`Primary command failed`, verbosity);
    }
  }

  try {
    // Try first fallback
    if (verbosity > logger.Verbosity.Quiet) {
      logger.verbose(`Trying fallback command`, verbosity);
    }
    const fallbackProcess = spawn(fallbackCommand, fallbackArgs, options);
    if (fallbackProcess.pid) {
      // Cache successful command
      global.lastSuccessfulCommand = fallbackCommand;
      global.lastSuccessfulArgs = fallbackArgs;
      return fallbackProcess;
    }
  } catch (error) {
    if (verbosity > logger.Verbosity.Quiet) {
      logger.verbose(`First fallback failed`, verbosity);
    }
  }

  // Try second fallback if provided
  if (secondFallback) {
    try {
      if (verbosity > logger.Verbosity.Quiet) {
        logger.verbose(`Trying second fallback command`, verbosity);
      }
      const secondFallbackProcess = spawn(secondFallback.command, secondFallback.args, options);
      if (secondFallbackProcess.pid) {
        // Cache successful command
        global.lastSuccessfulCommand = secondFallback.command;
        global.lastSuccessfulArgs = secondFallback.args;
        return secondFallbackProcess;
      }
    } catch (error) {
      if (verbosity > logger.Verbosity.Quiet) {
        logger.verbose(`Second fallback failed`, verbosity);
      }
    }
  }

  // If all attempts fail, return null
  if (verbosity > logger.Verbosity.Quiet) {
    logger.verbose("All process creation attempts failed", verbosity);
  }
  return null;
} 