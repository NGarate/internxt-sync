import { Verbosity } from '../interfaces/logger.js';
import { WebDAVConnectivityOptions, WebDAVServiceOptions, WebDAVClientOptions, UploadResult, DirectoryResult } from '../interfaces/webdav.js';
/**
 * CLI Commands Utility
 * Contains functions for running common CLI commands related to Internxt
 */

import * as logger from '../utils/logger.js';
import { runCommand, runCommandWithFallback, createInteractiveProcessWithFallback } from '../utils/command-runner.js';
import chalk from 'chalk';
import { isBunEnvironment } from '../utils/env-utils.js';
import * as inputUtils from '../utils/input-utils.js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { randomBytes } from 'crypto';
import { createClient } from 'webdav';

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
 * Create a temporary secure file with credentials
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} [twoFactorCode] - Optional two-factor code
 * @returns {Promise<{filePath: string, cleanup: Function}>} The path to the credentials file and cleanup function
 */
async function createCredentialsFile(email, password, twoFactorCode = null) {
  // Create a secure random temp file name
  const randomId = randomBytes(16).toString('hex');
  const tempDir = os.tmpdir();
  const filePath = path.join(tempDir, `internxt-creds-${randomId}.json`);
  
  // Create a credentials object
  const credentials = {
    email,
    password,
    ...(twoFactorCode ? { twoFactorCode } : {})
  };
  
  // Write to the file
  await fs.promises.writeFile(filePath, JSON.stringify(credentials), {
    encoding: 'utf8',
    mode: 0o600 // Read/write for owner only
  });
  
  // Return the path and a cleanup function
  const cleanup = async () => {
    try {
      await fs.promises.unlink(filePath);
    } catch (error) {
      // Silently fail if file can't be deleted
    }
  };
  
  return { filePath, cleanup };
}

/**
 * Attempt a direct non-interactive login with credentials
 * This is an alternative method that tries to avoid the interactive prompts
 * @param {string} email - User email
 * @param {string} password - User password 
 * @param {string} [twoFactorCode] - Optional two-factor code
 * @param {number} verbosity - Verbosity level
 * @returns {Promise<boolean>} Whether login was successful
 */
async function directLogin(email, password, twoFactorCode, verbosity) {
  // Create a temporary credentials file
  let credFile = null;
  let cleanup = null;
  
  try {
    // Store credentials in a secure temporary file
    ({ filePath: credFile, cleanup } = await createCredentialsFile(email, password, twoFactorCode));
    
    // Always use quiet mode
    const cmdVerbosity = logger.Verbosity.Quiet;
    
    // Use auth login with credentials file for better security
    let result = await runCommandWithFallback(
      `internxt auth login --credentials-file "${credFile}"`,
      `npx @internxt/cli auth login --credentials-file "${credFile}"`,
      {
        env: {
          ...process.env,
          CI: "1",
          NON_INTERACTIVE: "1"
        }
      },
      cmdVerbosity
    );
    
    // If the file-based auth doesn't work, fall back to command line args
    // but only use email on command line, with password in the file for safety
    if (!result || result.stderr?.includes("unknown option")) {
      let fallbackArgs = ["login", "--email", email];
      
      if (twoFactorCode) {
        fallbackArgs.push("--two-factor", twoFactorCode);
      }
      
      // Use stdin to provide password (safer than command line args)
      result = await runCommandWithFallback(
        `internxt ${fallbackArgs.join(" ")}`,
        `npx @internxt/cli ${fallbackArgs.join(" ")}`,
        {
          env: {
            ...process.env,
            CI: "1",
            NON_INTERACTIVE: "1"
          },
          input: password + "\n" // Provide password via stdin
        },
        cmdVerbosity
      );
    }
    
    if (result && result.stdout) {
      if (result.stdout.includes("Welcome") || 
          result.stdout.includes("successfully") || 
          result.stdout.includes("Logged in")) {
        logger.success("Successfully logged in to Internxt", verbosity);
        return true;
      }
      
      if (result.stdout.includes("two-factor") || result.stdout.includes("2FA")) {
        // If 2FA is required but not provided, we need to fall back to interactive mode
        if (!twoFactorCode) {
          return false;
        }
      }
      
      if (result.stdout.includes("Invalid credentials") || 
          result.stdout.includes("Authentication failed")) {
        logger.error("Invalid credentials", verbosity);
        return false;
      }
    }
    
    return false; // Default to false if no success pattern found
  } catch (error) {
    logger.verbose(`Direct login failed: ${error.message}`, verbosity);
    return false;
  } finally {
    // Always clean up the credentials file
    if (cleanup) {
      try {
        await cleanup();
      } catch (err) {
        logger.verbose("Failed to clean up temporary credentials file", verbosity);
      }
    }
  }
}

/**
 * Path to the saved session file
 * This is stored in the user's home directory
 */
function getSessionFilePath() {
  const homeDir = os.homedir();
  const configDir = path.join(homeDir, '.internxt');
  
  // Ensure the config directory exists
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { mode: 0o700 }); // rwx for user only
  }
  
  return path.join(configDir, 'session.json');
}

/**
 * Check if there's an active session by looking for auth token files
 * This avoids storing the password while still enabling automatic login
 * @param {number} verbosity - Verbosity level
 * @returns {Promise<boolean>} True if an active session exists
 */
async function checkForExistingSession(verbosity) {
  try {
    // First check the standard session token locations
    const homeDir = os.homedir();
    const possibleTokenDirs = [
      path.join(homeDir, '.config', 'internxt'),
      path.join(homeDir, '.internxt'),
      path.join(homeDir, '.config', '@internxt'),
      path.join(homeDir, 'AppData', 'Roaming', 'internxt')
    ];
    
    for (const dir of possibleTokenDirs) {
      if (fs.existsSync(dir)) {
        const files = await fs.promises.readdir(dir);
        // Look for token files like auth.json, token.json, etc.
        const tokenFiles = files.filter(file => 
          file.includes('auth') || 
          file.includes('token') || 
          file.includes('session')
        );
        
        if (tokenFiles.length > 0) {
          logger.verbose(`Found existing session token in ${dir}`, verbosity);
          return true;
        }
      }
    }
    
    return false;
  } catch (error) {
    logger.verbose(`Error checking for existing session: ${error.message}`, verbosity);
    return false;
  }
}

/**
 * Save user email for future reference (but NOT the password)
 * @param {string} email - User email
 * @returns {Promise<boolean>} Whether the email was saved successfully
 */
export async function saveUserEmail(email) {
  try {
    const filePath = getSessionFilePath();
    
    const sessionInfo = {
      email,
      lastLoginTimestamp: Date.now()
    };
    
    await fs.promises.writeFile(filePath, JSON.stringify(sessionInfo), {
      encoding: 'utf8',
      mode: 0o600 // Read/write for owner only
    });
    
    return true;
  } catch (error) {
    logger.error(`Failed to save session info: ${error.message}`);
    return false;
  }
}

/**
 * Load saved user email
 * @returns {Promise<string|null>} The email or null if none found
 */
export async function loadUserEmail() {
  try {
    const filePath = getSessionFilePath();
    
    if (!fs.existsSync(filePath)) {
      return null;
    }
    
    const data = await fs.promises.readFile(filePath, 'utf8');
    const sessionInfo = JSON.parse(data);
    
    // Check if session info has expired (older than 30 days)
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    if (Date.now() - sessionInfo.lastLoginTimestamp > thirtyDaysMs) {
      logger.warning('Session information has expired.');
      return null;
    }
    
    return sessionInfo.email;
  } catch (error) {
    logger.verbose(`Failed to load session info: ${error.message}`);
    return null;
  }
}

/**
 * Try to use an existing session for login
 * @param {number} verbosity - Verbosity level
 * @returns {Promise<boolean>} True if login successful using existing session
 */
export async function loginWithExistingSession(verbosity) {
  // Check if there's an existing valid session
  const hasSession = await checkForExistingSession(verbosity);
  
  if (!hasSession) {
    return false;
  }
  
  try {
    // Get the saved email if available
    const email = await loadUserEmail();
    
    if (email) {
      logger.info(`Using existing session for ${email}...`, verbosity);
    } else {
      logger.info(`Using existing session...`, verbosity);
    }
    
    // Try to use the existing session with the whoami command
    const result = await runCommandWithFallback(
      "internxt whoami",
      "npx @internxt/cli whoami",
      {},
      logger.Verbosity.Quiet
    );
    
    // If whoami works, we're already logged in
    if (result && result.stdout && result.stdout.includes("You are logged in as:")) {
      // Extract email from pattern
      const emailMatch = result.stdout.match(/You are logged in as:\s*(.*)/i);
      const sessionEmail = emailMatch ? emailMatch[1].trim() : "your account";
      
      logger.success(`Already logged in as ${sessionEmail}`, verbosity);
      
      // Update the saved email if it's different or not saved
      if (!email || email !== sessionEmail) {
        await saveUserEmail(sessionEmail);
      }
      
      return true;
    }
    
    return false;
  } catch (error) {
    logger.verbose(`Failed to use existing session: ${error.message}`, verbosity);
    return false;
  }
}

/**
 * Login to Internxt with the simplest possible approach
 * This uses the CLI's built-in login command directly with minimal interaction
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {number} verbosity - Verbosity level
 * @returns {Promise<boolean>} Whether login was successful
 */
async function simpleLogin(email, password, verbosity) {
  try {
    logger.info("Logging in directly via CLI...", verbosity);
    
    // Use environment variables for non-interactive login
    const child = require('child_process').spawn('internxt', ['login'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true,
      env: {
        ...process.env,
        CI: '1',
        NON_INTERACTIVE: '1',
        INTERNXT_EMAIL: email,
        INTERNXT_PASSWORD: password
      }
    });
    
    let stdoutData = '';
    let stderrData = '';
    
    child.stdout.on('data', (data) => {
      const output = data.toString();
      stdoutData += output;
      
      if (verbosity >= logger.Verbosity.Verbose) {
        logger.verbose(`Output: ${output}`, verbosity);
      }
    });
    
    child.stderr.on('data', (data) => {
      const error = data.toString();
      stderrData += error;
      if (verbosity >= logger.Verbosity.Verbose) {
        logger.verbose(`Error: ${error}`, verbosity);
      }
    });
    
    // Set a timeout to kill the process if it hangs
    const timeout = setTimeout(() => {
      logger.warning("Login process is taking too long, terminating...", verbosity);
      child.kill('SIGTERM');
    }, 15000);
    
    // Wait for the process to complete
    return new Promise((resolve) => {
      child.on('close', (code) => {
        clearTimeout(timeout);
        
        if (code === 0 || stdoutData.includes('Welcome') || stdoutData.includes('successfully')) {
          logger.success("Login successful", verbosity);
          resolve(true);
        } else {
          // Check for 2FA - we'll handle this separately
          if (stdoutData.includes('two-factor') || stdoutData.includes('2FA')) {
            logger.info("2FA required - falling back to manual method", verbosity);
            resolve(false); // Handle 2FA in the main login method
          } else {
            logger.error(`Login process exited with code ${code}`, verbosity);
            resolve(false);
          }
        }
      });
    });
  } catch (error) {
    logger.error(`Simple login error: ${error.message}`, verbosity);
    return false;
  }
}

/**
 * Login to Internxt
 * @param {number} verbosity - The verbosity level
 * @returns {Promise<boolean>} True if login successful
 */
export async function login(verbosity) {
  try {
    // First try to login with an existing session (no password needed)
    const sessionLoginSuccess = await loginWithExistingSession(verbosity);
    if (sessionLoginSuccess) {
      return true;
    }
    
    // Get saved email to prefill if available
    const savedEmail = await loadUserEmail();
    
    logger.always(chalk.blue("Please log in to your Internxt account."));
    
    // Get valid email from user
    let email;
    let isEmailValid = false;
    
    while (!isEmailValid) {
      email = await inputUtils.promptUser(chalk.blue(`Email${savedEmail ? ` (${savedEmail})` : ''}: `));
      
      // Use saved email if user just presses Enter
      if (!email && savedEmail) {
        email = savedEmail;
      }
      
      if (!isValidEmail(email)) {
        logger.error("Invalid email format. Please enter a valid email address.");
        continue;
      }
      isEmailValid = true;
    }
    
    // Get password
    const password = await inputUtils.promptPassword(chalk.blue("Password"));
    
    // Try simple login first - this is the least likely to get stuck
    const simpleLoginSuccess = await simpleLogin(email, password, verbosity);
    if (simpleLoginSuccess) {
      await saveUserEmail(email);
      return true;
    }
    
    // If simple login fails, try direct login
    const directLoginSuccess = await directLogin(email, password, null, verbosity);
    if (directLoginSuccess) {
      // Save the email address only (not the password)
      await saveUserEmail(email);
      return true;
    }
    
    // If both methods fail, we need to handle 2FA
    logger.info("You may need to enter a two-factor authentication code.", verbosity);
    
    const twoFactorCode = await inputUtils.promptUser(chalk.blue("Two-factor code (if required): "));
    
    // If user entered a 2FA code, try again with it
    if (twoFactorCode && twoFactorCode.length > 0) {
      if (!/^\d{6}$/.test(twoFactorCode)) {
        logger.warning("Two-factor code should be 6 digits.", verbosity);
      }
      
      // Try direct login with 2FA
      const twoFactorLoginSuccess = await directLogin(email, password, twoFactorCode, verbosity);
      if (twoFactorLoginSuccess) {
        await saveUserEmail(email);
        return true;
      }
    }
    
    // If all attempts fail, report the error
    logger.error("All login attempts failed. Please try again or use the CLI directly: 'internxt login'", verbosity);
    return false;
    
  } catch (error) {
    logger.error(`Login error: ${error.message}`, verbosity);
    return false;
  }
}

/**
 * Basic email validation function
 * @param {string} email - The email to validate
 * @returns {boolean} - Whether the email is valid
 */
function isValidEmail(email) {
  // Simple regex for basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Path to the WebDAV config file
 * This is stored in the user's home directory
 */
function getWebDAVConfigPath() {
  const homeDir = os.homedir();
  const configDir = path.join(homeDir, '.internxt');
  
  // Ensure the config directory exists
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { mode: 0o700 }); // rwx for user only
  }
  
  return path.join(configDir, 'webdav-config.json');
}

/**
 * Save WebDAV URL to config file
 * @param {string} url - The WebDAV URL to save
 * @returns {Promise<boolean>} Whether the URL was saved successfully
 */
export async function saveWebDAVUrl(url) {
  try {
    const filePath = getWebDAVConfigPath();
    
    const config = {
      url,
      lastUpdated: Date.now()
    };
    
    await fs.promises.writeFile(filePath, JSON.stringify(config), {
      encoding: 'utf8',
      mode: 0o600 // Read/write for owner only
    });
    
    return true;
  } catch (error) {
    logger.error(`Failed to save WebDAV URL: ${error.message}`);
    return false;
  }
}

/**
 * Load WebDAV URL from config file
 * @returns {Promise<string|null>} The WebDAV URL or null if not found
 */
export async function loadWebDAVUrl() {
  try {
    const filePath = getWebDAVConfigPath();
    
    if (!fs.existsSync(filePath)) {
      return null;
    }
    
    const data = await fs.promises.readFile(filePath, 'utf8');
    const config = JSON.parse(data);
    
    return config.url;
  } catch (error) {
    logger.verbose(`Failed to load WebDAV URL: ${error.message}`);
    return null;
  }
}

/**
 * Get WebDAV URL from environment or detect it
 * @param {number} verbosity - Verbosity level
 * @param {boolean} skipSetup - Whether to skip WebDAV setup checks
 * @returns {Promise<string>} WebDAV URL
 */
export async function getWebDAVUrl(verbosity, skipSetup = false) {
  // Check environment variable first
  const envUrl = process.env.INTERNXT_WEBDAV_URL;
  if (envUrl) {
    logger.info(`Using WebDAV URL from environment: ${envUrl}`, verbosity);
    return envUrl;
  }

  // Try to load from config file
  const savedUrl = await loadWebDAVUrl();
  if (savedUrl) {
    logger.info(`Using saved WebDAV URL: ${savedUrl}`, verbosity);
    return savedUrl;
  }

  // If skip setup is true, use default URL
  if (skipSetup) {
    const defaultUrl = "http://127.0.0.1:3005";
    logger.info(`Using default WebDAV URL: ${defaultUrl}`, verbosity);
    return defaultUrl;
  }

  // Otherwise check if WebDAV is enabled
  logger.info("Checking for WebDAV URL...", verbosity);
  const status = await checkWebDAVEnabled(verbosity);
  
  if (status.enabled && status.url) {
    logger.info(`Using detected WebDAV URL: ${status.url}`, verbosity);
    // Only save the URL if we're not skipping setup
    if (!skipSetup) {
      await saveWebDAVUrl(status.url);
    }
    return status.url;
  }
  
  throw new Error("WebDAV is not enabled. Please run 'internxt webdav enable' first.");
}

/**
 * Check if WebDAV is enabled
 * @param {number} verbosity - Verbosity level
 * @param {boolean} skipSetup - Whether to skip WebDAV setup checks
 * @returns {Promise<{enabled: boolean, url: string}>} WebDAV status and URL
 */
export async function checkWebDAVEnabled(verbosity, skipSetup = false) {
  // If skip setup is true, return enabled with default URL
  if (skipSetup) {
    return { enabled: true, url: "http://127.0.0.1:3005" };
  }

  logger.info("Checking if WebDAV is enabled...", verbosity);
  
  try {
    // Use quiet verbosity to reduce output noise
    const queryVerbosity = logger.Verbosity.Quiet;
    
    // Try direct command first, then NPX
    const result = await runCommandWithFallback(
      "internxt webdav status",
      "npx @internxt/cli webdav status",
      {},
      queryVerbosity
    );
    
    if (result && result.stdout) {
      // Check for different patterns that indicate WebDAV is running
      if (
        result.stdout.includes("status: online") || 
        result.stdout.includes("WebDav server status: online") ||
        result.stdout.includes("WebDAV server is running")
      ) {
        // Try to extract the URL - various pattern matching attempts
        let match = result.stdout.match(/localhost IP at: (https?:\/\/[^\s\n"']+)/i);
        
        if (!match) {
          match = result.stdout.match(/at (https?:\/\/[^\s\n"']+)/i);
        }
        
        if (!match) {
          // Try to find any URL in the output
          match = result.stdout.match(/(https?:\/\/[^\s\n"']+)/i);
        }
        
        if (match && match[1]) {
          const url = match[1].trim();
          // Always prefer localhost IP over the hostname
          const localhostUrl = url.replace(/webdav\.local\.internxt\.com/, '127.0.0.1');
          
          // Try to connect using the WebDAV client
          try {
            const client = createClient(localhostUrl, {
              username: 'internxt',
              password: 'internxt'
            });
            
            // Try to list the root directory
            await client.getDirectoryContents('/');
            logger.success(`WebDAV is enabled and accessible at ${localhostUrl}`, verbosity);
            return { enabled: true, url: localhostUrl };
          } catch (clientError) {
            logger.warning(`WebDAV server is running but not accessible: ${clientError.message}`, verbosity);
            return { enabled: false, url: null };
          }
        }
        
        // If we know it's enabled but couldn't parse the URL, try running enable to get the URL
        const enableResult = await runCommandWithFallback(
          "internxt webdav enable",
          "npx @internxt/cli webdav enable",
          {},
          queryVerbosity
        );
        
        if (enableResult && enableResult.stdout) {
          // Try to extract URL from enable command output
          match = enableResult.stdout.match(/localhost IP at: (https?:\/\/[^\s\n"']+)/i);
          if (!match) {
            match = enableResult.stdout.match(/at (https?:\/\/[^\s\n"']+)/i);
          }
          
          if (match && match[1]) {
            const url = match[1].trim();
            // Always prefer localhost IP over the hostname
            const localhostUrl = url.replace(/webdav\.local\.internxt\.com/, '127.0.0.1');
            
            // Try to connect using the WebDAV client
            try {
              const client = createClient(localhostUrl, {
                username: 'internxt',
                password: 'internxt'
              });
              
              // Try to list the root directory
              await client.getDirectoryContents('/');
              logger.success(`WebDAV is enabled and accessible at ${localhostUrl}`, verbosity);
              return { enabled: true, url: localhostUrl };
            } catch (clientError) {
              logger.warning(`WebDAV server is running but not accessible: ${clientError.message}`, verbosity);
              return { enabled: false, url: null };
            }
          }
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
    // Set to quiet mode to reduce terminal pollution
    const setupVerbosity = logger.Verbosity.Quiet;
    
    // First configure WebDAV to use HTTP
    logger.info("Configuring WebDAV to use HTTP...", verbosity);
    const configResult = await runCommandWithFallback(
      "internxt webdav-config --http",
      "npx @internxt/cli webdav-config --http",
      {},
      setupVerbosity
    );
    
    if (!configResult || configResult.stderr) {
      logger.error("Failed to configure WebDAV", verbosity);
      return { success: false, url: null };
    }
    
    // Then start the WebDAV server
    logger.info("Starting WebDAV server...", verbosity);
    const enableResult = await runCommandWithFallback(
      "internxt webdav enable",
      "npx @internxt/cli webdav enable",
      {},
      setupVerbosity
    );
    
    if (!enableResult || enableResult.stderr) {
      logger.error("Failed to enable WebDAV", verbosity);
      return { success: false, url: null };
    }
    
    // Wait longer for the server to start (10 seconds)
    logger.info("Waiting for WebDAV server to start...", verbosity);
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Check if it's running and get the URL
    const status = await checkWebDAVEnabled(verbosity);
    
    if (status.enabled && status.url) {
      // Try to connect to the server using the WebDAV client
      try {
        const client = createClient(status.url, {
          username: 'internxt',
          password: 'internxt'
        });
        
        // Try to list the root directory
        await client.getDirectoryContents('/');
        logger.success(`WebDAV server is now running and accessible at ${status.url}`, verbosity);
        return { success: true, url: status.url };
      } catch (clientError) {
        logger.warning("WebDAV server is running but not accessible yet. Waiting longer...", verbosity);
        // Wait another 10 seconds and try again
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        try {
          const client = createClient(status.url, {
            username: 'internxt',
            password: 'internxt'
          });
          
          // Try to list the root directory
          await client.getDirectoryContents('/');
          logger.success(`WebDAV server is now running and accessible at ${status.url}`, verbosity);
          return { success: true, url: status.url };
        } catch (retryError) {
          logger.error(`Failed to connect to WebDAV server: ${retryError.message}`, verbosity);
          return { success: false, url: null };
        }
      }
    }
    
    logger.error("Failed to verify WebDAV server is running and accessible", verbosity);
    return { success: false, url: null };
    
  } catch (error) {
    logger.error(`Failed to enable WebDAV: ${error}`);
    return { success: false, url: null };
  }
} 