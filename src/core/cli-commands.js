/**
 * CLI Commands Utility
 * Contains functions for running common CLI commands related to Internxt
 */

import * as logger from '../utils/logger.js';
import { runCommand, runCommandWithFallback, createInteractiveProcessWithFallback } from '../utils/command-runner.js';
import chalk from 'chalk';
import { isBunEnvironment } from '../utils/env-utils.js';
import * as inputUtils from '../utils/input-utils.js';

/**
 * Check if Internxt CLI is installed
 * @param {number} verbosity - Verbosity level
 * @returns {Promise<{installed: boolean, version: string}>} Installation status and version
 */
export async function checkInternxtInstalled(verbosity) {
  logger.info("Checking if Internxt CLI is installed...", verbosity);
  
  try {
    // Try direct command first, then NPX
    const result = await runCommandWithFallback(
      "internxt --version",
      "npx @internxt/cli --version",
      {},
      verbosity
    );
    
    if (result) {
      const version = result.stdout.trim();
      logger.success(`Internxt CLI is installed (version: ${version})`, verbosity);
      return { installed: true, version };
    }
  } catch (error) {
    logger.warning("Internxt CLI is not installed yet.", verbosity);
  }
  
  return { installed: false, version: null };
}

/**
 * Install Internxt CLI
 * @param {number} verbosity - Verbosity level
 * @returns {Promise<boolean>} True if installation was successful
 */
export async function installInternxtCLI(verbosity) {
  logger.info("Installing Internxt CLI globally...", verbosity);
  
  try {
    if (isBunEnvironment()) {
      // Try with Bun first
      try {
        logger.info("Trying installation with Bun...", verbosity);
        await runCommand("bun install -g @internxt/cli", {}, verbosity);
        logger.success("Internxt CLI installed successfully with Bun! You can now use the 'internxt' command.", verbosity);
        return true;
      } catch (bunError) {
        logger.warning(`Bun installation failed: ${bunError}`, verbosity);
        // Fall through to npm installation
      }
    }
    
    // Try with npm as fallback
    logger.info("Trying installation with npm...", verbosity);
    await runCommand("npm install -g @internxt/cli", {}, verbosity);
    logger.success("Internxt CLI installed successfully with npm! You can now use the 'internxt' command.", verbosity);
    return true;
  } catch (npmError) {
    logger.error(`Failed to install Internxt CLI: ${npmError}`);
    logger.error("Please install it manually using one of these commands:");
    logger.always(chalk.yellow("bun install -g @internxt/cli"));
    logger.always(chalk.yellow("or"));
    logger.always(chalk.yellow("npm install -g @internxt/cli"));
    return false;
  }
}

/**
 * Check if user is logged in to Internxt
 * @param {number} verbosity - Verbosity level
 * @returns {Promise<{loggedIn: boolean, email: string}>} Login status and user email
 */
export async function checkLoggedIn(verbosity) {
  logger.info("Checking if logged in to Internxt...", verbosity);
  
  try {
    // Try direct command first, then NPX
    const result = await runCommandWithFallback(
      "internxt whoami",
      "npx @internxt/cli whoami",
      {},
      verbosity
    );
    
    if (result && result.stdout) {
      // Check for the successful login message like "✓ You are logged in as: example@email.com"
      if (result.stdout.includes("You are logged in as:")) {
        // Extract email from pattern
        const emailMatch = result.stdout.match(/You are logged in as:\s*(.*)/i);
        const email = emailMatch ? emailMatch[1].trim() : "unknown user";
        
        logger.success(`Logged in as ${email}`, verbosity);
        return { loggedIn: true, email };
      }
      
      // If we're not logged in, the message will contain "You are not logged in"
      if (result.stdout.includes("You are not logged in")) {
        logger.warning("Not logged in to Internxt.", verbosity);
        return { loggedIn: false, email: null };
      }
    }
  } catch (error) {
    logger.verbose("Could not check login status with whoami.", verbosity);
  }
  
  // Default to not logged in if we couldn't determine the status
  logger.warning("Unable to determine login status, assuming not logged in.", verbosity);
  return { loggedIn: false, email: null };
}

/**
 * Login to Internxt
 * @param {number} verbosity - Verbosity level
 * @returns {Promise<boolean>} True if login successful
 */
export async function login(verbosity) {
  logger.always(chalk.blue("Please log in to your Internxt account."));
  
  const email = await inputUtils.promptUser(chalk.blue("Email: "));
  const password = await inputUtils.promptPassword(chalk.blue("Password: "));
  
  // Try direct login first, then fall back to npx if needed
  const loginProcess = createInteractiveProcessWithFallback(
    "internxt", ["login"],
    "npx", ["@internxt/cli", "login"],
    { stdio: ["pipe", "pipe", "pipe"] },
    verbosity
  );
  
  // Send email and password to the process
  loginProcess.stdin.write(`${email}\n`);
  
  // Wait a moment before sending password
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  loginProcess.stdin.write(`${password}\n`);
  
  // Handle 2FA if needed
  let stdout = "";
  let twoFactorRequested = false;
  
  loginProcess.stdout.on("data", async (data) => {
    const output = data.toString();
    stdout += output;
    
    if ((output.includes("2FA") || output.includes("two-factor")) && !twoFactorRequested) {
      twoFactorRequested = true;
      const twoFactorCode = await inputUtils.promptUser(chalk.blue("2FA Code: "));
      loginProcess.stdin.write(`${twoFactorCode}\n`);
    }
  });
  
  // Wait for process to complete
  try {
    await new Promise((resolve, reject) => {
      loginProcess.on("close", (code) => {
        loginProcess.stdin.end();
        if (code === 0 || stdout.includes("Welcome")) {
          resolve();
        } else {
          reject(new Error("Login failed"));
        }
      });
    });
    
    logger.success("Successfully logged in to Internxt!", verbosity);
    return true;
  } catch (error) {
    logger.error(`Login failed: ${error}`);
    return false;
  }
}

/**
 * Check if WebDAV is enabled
 * @param {number} verbosity - Verbosity level
 * @returns {Promise<{enabled: boolean, url: string}>} WebDAV status and URL
 */
export async function checkWebDAVEnabled(verbosity) {
  logger.info("Checking if WebDAV is enabled...", verbosity);
  
  try {
    // Try direct command first, then NPX
    const result = await runCommandWithFallback(
      "internxt webdav status",
      "npx @internxt/cli webdav status",
      {},
      verbosity
    );
    
    if (result && result.stdout) {
      // Check for different patterns that indicate WebDAV is running
      if (
        result.stdout.includes("enabled: true") || 
        result.stdout.includes("running") || 
        result.stdout.includes("WebDAV is enabled") ||
        result.stdout.includes("WebDAV server is running")
      ) {
        // Try to extract the URL - various pattern matching attempts
        // First try the standard format
        let match = result.stdout.match(/url:?\s*(https?:\/\/[^\s\n"']+)/i);
        
        // If not found, try alternate patterns
        if (!match) {
          match = result.stdout.match(/https?:\/\/[^\s\n"']+/i);
        }
        
        if (match && match[1]) {
          const url = match[1].trim();
          logger.success(`WebDAV is enabled at ${url}`, verbosity);
          return { enabled: true, url };
        } else if (match) {
          // If we only found a URL without the capture group
          const url = match[0].trim();
          logger.success(`WebDAV is enabled at ${url}`, verbosity);
          return { enabled: true, url };
        }
        
        // We know it's enabled but couldn't parse the URL
        logger.warning("WebDAV is enabled but couldn't determine the URL.", verbosity);
        return { enabled: true, url: null };
      }
    }
  } catch (error) {
    logger.verbose("Could not check WebDAV status.", verbosity);
  }
  
  logger.warning("WebDAV is not enabled.", verbosity);
  return { enabled: false, url: null };
}

/**
 * Enable WebDAV
 * @param {number} verbosity - Verbosity level
 * @returns {Promise<{success: boolean, url: string}>} Success status and WebDAV URL
 */
export async function enableWebDAV(verbosity) {
  logger.info("Enabling WebDAV...", verbosity);
  
  try {
    // Configure WebDAV to use HTTP (avoids SSL certificate issues)
    await runCommandWithFallback(
      "internxt webdav-config --http",
      "npx @internxt/cli webdav-config --http",
      {},
      verbosity
    );
    
    // Start the WebDAV server
    await runCommandWithFallback(
      "internxt webdav start",
      "npx @internxt/cli webdav start",
      {},
      verbosity
    );
    
    // Check if it's running and get the URL
    const status = await checkWebDAVEnabled(verbosity);
    
    return { 
      success: status.enabled, 
      url: status.url 
    };
  } catch (error) {
    logger.error(`Failed to enable WebDAV: ${error}`);
    return { success: false, url: null };
  }
} 