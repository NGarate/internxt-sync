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
    logger.verbose(`Running command: ${command}`, verbosity);
    const result = await execAsync(command, options);
    return result;
  } catch (error) {
    logger.verbose(`Command failed: ${command}`, verbosity);
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
    logger.verbose(`Trying primary command: ${primaryCommand}`, verbosity);
    return await execAsync(primaryCommand, options);
  } catch (primaryError) {
    logger.verbose(`Primary command failed, trying fallback: ${fallbackCommand}`, verbosity);
    try {
      return await execAsync(fallbackCommand, options);
    } catch (fallbackError) {
      logger.verbose(`Fallback command also failed`, verbosity);
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
    logger.verbose(`Starting interactive process: ${command} ${args.join(' ')}`, verbosity);
    return spawn(command, args, { stdio: ["pipe", "pipe", "pipe"], ...options });
  } catch (error) {
    logger.verbose(`Failed to start interactive process, will try fallback if provided`, verbosity);
    throw error;
  }
}

/**
 * Create an interactive process with fallback
 * @param {string} primaryCommand - Primary command
 * @param {string[]} primaryArgs - Primary command arguments
 * @param {string} fallbackCommand - Fallback command
 * @param {string[]} fallbackArgs - Fallback command arguments
 * @param {object} options - Spawn options
 * @param {number} verbosity - Verbosity level for logging
 * @returns {object} Process object
 */
export function createInteractiveProcessWithFallback(
  primaryCommand,
  primaryArgs,
  fallbackCommand,
  fallbackArgs,
  options = {},
  verbosity = logger.Verbosity.Normal
) {
  try {
    logger.verbose(`Starting primary interactive process: ${primaryCommand} ${primaryArgs.join(' ')}`, verbosity);
    return spawn(primaryCommand, primaryArgs, { stdio: ["pipe", "pipe", "pipe"], ...options });
  } catch (primaryError) {
    logger.verbose(
      `Primary process failed, trying fallback: ${fallbackCommand} ${fallbackArgs.join(' ')}`,
      verbosity
    );
    return spawn(fallbackCommand, fallbackArgs, { stdio: ["pipe", "pipe", "pipe"], ...options });
  }
} 