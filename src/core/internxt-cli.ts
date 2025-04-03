import { Verbosity } from '../interfaces/logger.js';
import { WebDAVConnectivityOptions, WebDAVServiceOptions, WebDAVClientOptions, UploadResult, DirectoryResult } from '../interfaces/webdav.js';
/**
 * Internxt CLI Manager
 * Handles all interactions with the Internxt CLI including installation, login, and WebDAV
 */

import * as logger from '../utils/logger.js';
import * as cliCommands from './cli-commands.js';

/**
 * Internxt CLI Manager Class
 * Handles installation, authentication, and WebDAV management through the Internxt CLI
 */
export default class InternxtCLI {
  constructor(verbosity = logger.Verbosity.Normal) {
    this.verbosity = verbosity;
    this.config = {
      isInstalled: false,
      isLoggedIn: false,
      webdavEnabled: false,
      webdavUrl: null
    };
  }

  /**
   * Check if Internxt CLI is installed
   * @returns {Promise<boolean>} True if installed
   */
  async checkInstalled() {
    const { installed } = await cliCommands.checkInternxtInstalled(this.verbosity);
    this.config.isInstalled = installed;
    return installed;
  }

  /**
   * Install Internxt CLI
   * @returns {Promise<boolean>} True if installation was successful
   */
  async install() {
    const success = await cliCommands.installInternxtCLI(this.verbosity);
    if (success) {
      this.config.isInstalled = true;
    }
    return success;
  }

  /**
   * Check if user is logged in to Internxt
   * @returns {Promise<boolean>} True if logged in
   */
  async checkLoggedIn() {
    const { loggedIn, email } = await cliCommands.checkLoggedIn(this.verbosity);
    this.config.isLoggedIn = loggedIn;
    
    // Store the email for user feedback if needed
    if (loggedIn) {
      this.config.email = email;
    }
    
    return loggedIn;
  }

  /**
   * Login to Internxt
   * @returns {Promise<boolean>} True if login successful
   */
  async login() {
    try {
      // First check if already logged in - but don't log the check
      const { loggedIn } = await cliCommands.checkLoggedIn(logger.Verbosity.Quiet);
      
      if (loggedIn) {
        logger.success("Already logged in to Internxt!", this.verbosity);
        this.config.isLoggedIn = true;
        return true;
      }
      
      // If not logged in, proceed with login
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        attempts++;
        
        const success = await cliCommands.login(this.verbosity);
        if (success) {
          this.config.isLoggedIn = true;
          return true;
        }
        
        // If we've reached max attempts, give up
        if (attempts >= maxAttempts) {
          logger.error(`Failed to login after ${maxAttempts} attempts.`);
          return false;
        }
        
        // Otherwise, we'll loop and try again
        logger.info(`Attempt ${attempts}/${maxAttempts} failed. Trying again...`);
      }
      
      return false;
    } catch (error) {
      logger.error(`Login error: ${error.message}`);
      return false;
    }
  }

  /**
   * Check if WebDAV is enabled
   * @param {boolean} skipSetup - Whether to skip WebDAV setup checks
   * @returns {Promise<boolean>} True if WebDAV is enabled
   */
  async checkWebDAVEnabled(skipSetup = false) {
    const { enabled, url } = await cliCommands.checkWebDAVEnabled(this.verbosity, skipSetup);
    this.config.webdavEnabled = enabled;
    
    if (enabled && url) {
      this.config.webdavUrl = url;
    }
    
    return enabled;
  }

  /**
   * Enable WebDAV
   * @param {boolean} skipSetup - Whether to skip WebDAV setup checks
   * @returns {Promise<boolean>} True if WebDAV was enabled successfully
   */
  async enableWebDAV(skipSetup = false) {
    const { success, url } = await cliCommands.enableWebDAV(this.verbosity, skipSetup);
    
    if (success) {
      this.config.webdavEnabled = true;
      if (url) {
        this.config.webdavUrl = url;
      }
    }
    
    return success;
  }

  /**
   * Set up Internxt CLI and WebDAV
   * @param {boolean} skipSetup - Whether to skip WebDAV setup checks
   * @returns {Promise<boolean>} True if setup was successful
   */
  async setup(skipSetup = false) {
    try {
      // Check if Internxt CLI is installed
      if (!await this.checkInstalled()) {
        // Try to install it
        if (!await this.install()) {
          logger.error("Failed to install Internxt CLI. Please install it manually.");
          return false;
        }
      }
      
      // Try to login directly without checking first (the login method will check internally)
      if (!await this.login()) {
        logger.error("Authentication failed. Cannot proceed without being logged in.");
        return false;
      }
      
      // Check if WebDAV is enabled via the config command directly
      if (await this.checkWebDAVEnabled(skipSetup)) {
        return true;
      }
      
      // If not enabled and not skipping setup, try to enable it
      if (!skipSetup && !await this.enableWebDAV(skipSetup)) {
        logger.error("Failed to enable WebDAV. Cannot proceed.");
        return false;
      }
      
      return true;
    } catch (error) {
      logger.error(`Setup failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Get the WebDAV URL
   * @param {boolean} skipSetup - Whether to skip WebDAV setup checks
   * @returns {Promise<string|null>} The WebDAV URL or null if not available
   */
  async getWebDAVUrl(skipSetup = false) {
    // If we already have a URL in config, return it
    if (this.config.webdavUrl) {
      return this.config.webdavUrl;
    }

    // Otherwise, try to get it from the CLI
    const { enabled, url } = await cliCommands.checkWebDAVEnabled(this.verbosity, skipSetup);
    if (enabled && url) {
      this.config.webdavUrl = url;
      return url;
    }

    return null;
  }

  /**
   * Set a custom WebDAV URL
   * @param {string} url - The WebDAV URL to set
   */
  setWebDAVUrl(url) {
    this.config.webdavUrl = url;
    this.config.webdavEnabled = true;
  }
}

/**
 * Handle login to Internxt CLI
 * @param {boolean} forceLogin - Whether to force login even if already logged in
 * @returns {Promise<boolean>} Whether login was successful
 */
export async function loginToInternxt(forceLogin = false) {
  try {
    // Check if already logged in
    if (!forceLogin) {
      const isLoggedIn = await checkIfLoggedIn();
      if (isLoggedIn) {
        logger.info('Already logged in to Internxt.');
        return true;
      }
    }
    
    logger.info('Please log in to your Internxt account.');
    
    // Get credentials from user
    const { username, password } = await getCredentials('Email', 'Password');
    
    // Attempt login
    try {
      await runCommand(`internxt auth:login --email="${username}" --password="${password}"`);
      logger.success('Successfully logged in to Internxt.');
      return true;
    } catch (loginError) {
      logger.error('Login failed. Please check your credentials and try again.');
      
      // Ask if the user wants to try again
      const retry = await promptUser('Would you like to try again? (y/n): ');
      if (retry.toLowerCase() === 'y' || retry.toLowerCase() === 'yes') {
        return loginToInternxt(true);
      }
      
      return false;
    }
  } catch (error) {
    logger.error(`Error during login: ${error.message}`);
    return false;
  }
} 