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
  }

  /**
   * Initialize the tracker with the total number of files
   * @param {number} totalFiles - Total number of files to process
   */
  initialize(totalFiles) {
    this.totalFiles = totalFiles;
    this.completedFiles = 0;
    this.failedFiles = 0;
    this.displayProgress(); // Initial display
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
  }

  /**
   * Display a progress bar showing upload status
   */
  displayProgress() {
    const processed = this.completedFiles + this.failedFiles;
    const percentage = this.totalFiles > 0 ? Math.floor((processed / this.totalFiles) * 100) : 0;
    const barWidth = 30;
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
    // Always show the final summary, regardless of verbosity
    if (this.failedFiles === 0) {
      logger.always(chalk.green(`\nUpload completed successfully! All ${this.completedFiles} files uploaded.`));
    } else {
      logger.always(chalk.yellow(`\nUpload completed with issues: ${this.completedFiles} succeeded, ${this.failedFiles} failed.`));
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