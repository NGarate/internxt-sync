/**
 * ProgressTracker
 * Handles tracking and displaying upload progress
 */

import chalk from 'chalk';
import * as logger from '../../utils/logger.js';

/**
 * ProgressTracker class for monitoring upload progress
 */
export class ProgressTracker {
  /**
   * Create a new ProgressTracker
   * @param {number} verbosity - Verbosity level
   */
  constructor(verbosity = logger.Verbosity.Normal) {
    this.verbosity = verbosity;
    this.totalFiles = 0;
    this.completedFiles = 0;
    this.failedFiles = 0;
    this.updateInterval = null;
    this.isTrackingActive = false;
    
    // Store original console methods
    this.originalConsoleLog = console.log;
    this.originalConsoleInfo = console.info;
    this.originalConsoleWarn = console.warn;
    this.originalConsoleError = console.error;
  }

  /**
   * Initialize the tracker with the total number of files
   * @param {number} totalFiles - Total number of files to process
   */
  initialize(totalFiles) {
    this.totalFiles = totalFiles;
    this.completedFiles = 0;
    this.failedFiles = 0;
    this.setupConsoleOverrides();
  }

  /**
   * Set up console method overrides to preserve progress bar
   */
  setupConsoleOverrides() {
    const self = this;
    
    // Override console methods to preserve progress bar
    console.log = function() {
      if (self.isTrackingActive) {
        process.stdout.write('\r\x1B[K'); // Clear the current line
        self.originalConsoleLog.apply(console, arguments);
        self.displayProgress(); // Redraw progress bar
      } else {
        self.originalConsoleLog.apply(console, arguments);
      }
    };
    
    console.info = function() {
      if (self.isTrackingActive) {
        process.stdout.write('\r\x1B[K'); // Clear the current line
        self.originalConsoleInfo.apply(console, arguments);
        self.displayProgress(); // Redraw progress bar
      } else {
        self.originalConsoleInfo.apply(console, arguments);
      }
    };
    
    console.warn = function() {
      if (self.isTrackingActive) {
        process.stdout.write('\r\x1B[K'); // Clear the current line
        self.originalConsoleWarn.apply(console, arguments);
        self.displayProgress(); // Redraw progress bar
      } else {
        self.originalConsoleWarn.apply(console, arguments);
      }
    };
    
    console.error = function() {
      if (self.isTrackingActive) {
        process.stdout.write('\r\x1B[K'); // Clear the current line
        self.originalConsoleError.apply(console, arguments);
        self.displayProgress(); // Redraw progress bar
      } else {
        self.originalConsoleError.apply(console, arguments);
      }
    };
  }

  /**
   * Restore original console methods
   */
  restoreConsole() {
    console.log = this.originalConsoleLog;
    console.info = this.originalConsoleInfo;
    console.warn = this.originalConsoleWarn;
    console.error = this.originalConsoleError;
  }

  /**
   * Record a successful file upload
   */
  recordSuccess() {
    this.completedFiles++;
  }

  /**
   * Record a failed file upload
   */
  recordFailure() {
    this.failedFiles++;
  }

  /**
   * Start displaying progress updates
   * @param {number} intervalMs - Update interval in milliseconds
   */
  startProgressUpdates(intervalMs = 100) {
    // Clear any existing interval first
    this.stopProgressUpdates();
    
    this.isTrackingActive = true;
    
    // Add a blank line for separation
    process.stdout.write('\n');
    
    // Start a new interval
    this.updateInterval = setInterval(() => this.displayProgress(), intervalMs);
  }

  /**
   * Stop displaying progress updates
   */
  stopProgressUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    
    this.isTrackingActive = false;
    this.restoreConsole();
    
    // Clear the current line to remove progress bar
    process.stdout.write('\r\x1B[K');
  }

  /**
   * Display a progress bar showing upload status
   */
  displayProgress() {
    if (!this.isTrackingActive) return;
    
    const processed = this.completedFiles + this.failedFiles;
    const percentage = this.totalFiles > 0 ? Math.floor((processed / this.totalFiles) * 100) : 0;
    const barWidth = 40;
    const completeWidth = Math.floor((percentage / 100) * barWidth);
    const bar = "█".repeat(completeWidth) + "░".repeat(barWidth - completeWidth);
    
    // Use carriage return to move to the beginning of the line
    process.stdout.write(`\r[${bar}] ${percentage}% | ${processed}/${this.totalFiles}`);
    
    // Add a newline when complete
    if (processed === this.totalFiles && this.totalFiles > 0) {
      process.stdout.write("\n");
      this.stopProgressUpdates();
    }
  }

  /**
   * Display a summary of the upload results
   */
  displaySummary() {
    // Ensure we've cleared the progress bar
    if (this.isTrackingActive) {
      this.stopProgressUpdates();
    }
    
    // Always show the final summary, regardless of verbosity
    if (this.failedFiles === 0) {
      logger.always(chalk.green(`Upload completed successfully! All ${this.completedFiles} files uploaded.`));
    } else {
      logger.always(chalk.yellow(`Upload completed with issues: ${this.completedFiles} succeeded, ${this.failedFiles} failed.`));
    }
  }

  /**
   * Get the current progress as a percentage
   * @returns {number} Progress percentage (0-100)
   */
  getProgressPercentage() {
    const processed = this.completedFiles + this.failedFiles;
    return this.totalFiles > 0 ? Math.floor((processed / this.totalFiles) * 100) : 0;
  }

  /**
   * Check if all files have been processed
   * @returns {boolean} True if all files have been processed
   */
  isComplete() {
    return (this.completedFiles + this.failedFiles) === this.totalFiles && this.totalFiles > 0;
  }
} 