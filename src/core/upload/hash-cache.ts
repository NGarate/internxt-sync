import { Verbosity } from '../interfaces/logger';
/**
 * HashCache
 * Handles the caching of file hashes to detect changes
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as logger from '../../utils/logger';

/**
 * HashCache class to manage file hash caching
 */
export class HashCache {
  /**
   * Create a new HashCache instance
   * @param {string} cachePath - Path to the cache file
   * @param {number} verbosity - Verbosity level
   */
  constructor(cachePath, verbosity = logger.Verbosity.Normal) {
    this.cachePath = cachePath;
    this.verbosity = verbosity;
    this.cache = new Map();
  }

  /**
   * Load cached hashes from file
   * @returns {Promise<boolean>} Success status
   */
  async load() {
    try {
      if (fs.existsSync(this.cachePath)) {
        const data = await fs.promises.readFile(this.cachePath, 'utf8');
        const cache = JSON.parse(data);
        this.cache = new Map(Object.entries(cache));
        logger.verbose(`Loaded hash cache from ${this.cachePath}`, this.verbosity);
        return true;
      }
      return false;
    } catch (error) {
      logger.error(`Error loading hash cache: ${error.message}`, this.verbosity);
      return false;
    }
  }

  /**
   * Save cached hashes to file
   * @returns {Promise<boolean>} Success status
   */
  async save() {
    try {
      const cache = Object.fromEntries(this.cache);
      await fs.promises.writeFile(this.cachePath, JSON.stringify(cache, null, 2));
      logger.verbose(`Saved hash cache to ${this.cachePath}`, this.verbosity);
      return true;
    } catch (error) {
      logger.error(`Error saving hash cache: ${error.message}`, this.verbosity);
      return false;
    }
  }

  /**
   * Calculate MD5 hash of a file
   * @param {string} filePath - Path to the file
   * @returns {Promise<string>} The file's MD5 hash
   */
  async calculateHash(filePath) {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('md5');
      const stream = fs.createReadStream(filePath);
      
      stream.on('error', reject);
      stream.on('data', chunk => hash.update(chunk));
      stream.on('end', () => resolve(hash.digest('hex')));
    });
  }

  /**
   * Check if a file has changed by comparing its hash with a stored hash
   * @param {string} filePath - Path to the file
   * @returns {Promise<boolean>} True if the file has changed
   */
  async hasChanged(filePath) {
    try {
      // Normalize the file path
      const normalizedPath = path.normalize(filePath);
      
      const currentHash = await this.calculateHash(normalizedPath);
      const storedHash = this.cache.get(normalizedPath);
      
      // If no stored hash exists, file has changed
      if (!storedHash) {
        logger.verbose(`No cached hash for ${normalizedPath}, marking as changed`, this.verbosity);
        this.cache.set(normalizedPath, currentHash);
        await this.save();
        return true;
      }
      
      // Compare hashes
      const hasChanged = currentHash !== storedHash;
      
      // Update stored hash if file has changed
      if (hasChanged) {
        logger.verbose(`File hash changed for ${normalizedPath}`, this.verbosity);
        this.cache.set(normalizedPath, currentHash);
        await this.save();
      } else {
        logger.verbose(`File ${normalizedPath} unchanged (hash match)`, this.verbosity);
      }
      
      return hasChanged;
    } catch (error) {
      logger.error(`Error checking file changes: ${error.message}`, this.verbosity);
      return true; // Assume file has changed if we can't check
    }
  }

  /**
   * Update the hash for a file
   * @param {string} filePath - Path to the file
   * @param {string} hash - Hash to store
   */
  updateHash(filePath, hash) {
    const normalizedPath = path.normalize(filePath);
    this.cache.set(normalizedPath, hash);
    // Intentionally not saving here for performance; caller should call save() when appropriate
  }

  /**
   * Get the number of entries in the cache
   * @returns {number} Cache size
   */
  get size() {
    return this.cache.size;
  }
} 