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
    // First check if already logged in - double-check to avoid unnecessary login
    const isLoggedIn = await this.checkLoggedIn();
    if (isLoggedIn) {
      logger.success("Already logged in to Internxt!", this.verbosity);
      return true;
    }
    
    const success = await cliCommands.login(this.verbosity);
    if (success) {
      this.config.isLoggedIn = true;
    }
    return success;
  }

  /**
   * Check if WebDAV is enabled
   * @returns {Promise<boolean>} True if WebDAV is enabled
   */
  async checkWebDAVEnabled() {
    const { enabled, url } = await cliCommands.checkWebDAVEnabled(this.verbosity);
    this.config.webdavEnabled = enabled;
    
    if (enabled && url) {
      this.config.webdavUrl = url;
    }
    
    return enabled;
  }

  /**
   * Enable WebDAV
   * @returns {Promise<boolean>} True if WebDAV was enabled successfully
   */
  async enableWebDAV() {
    const { success, url } = await cliCommands.enableWebDAV(this.verbosity);
    
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
   * @returns {Promise<boolean>} True if setup was successful
   */
  async setup() {
    // Check if Internxt CLI is installed
    if (!await this.checkInstalled()) {
      // Try to install it
      if (!await this.install()) {
        return false;
      }
    }
    
    // Check if logged in
    if (!await this.checkLoggedIn()) {
      // Try to login
      if (!await this.login()) {
        return false;
      }
    }
    
    // Check if WebDAV is enabled via the config command directly
    if (await this.checkWebDAVEnabled()) {
      return true;
    }
    
    // If not enabled, try to enable it
    if (!await this.enableWebDAV()) {
      return false;
    }
    
    return true;
  }

  /**
   * Get the WebDAV URL
   * @returns {string|null} The WebDAV URL or null if not available
   */
  getWebDAVUrl() {
    return this.config.webdavUrl;
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