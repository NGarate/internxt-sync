#!/usr/bin/env node

/**
 * Cross-platform clean script for Internxt WebDAV Uploader
 * This script handles cleaning compiled files on any operating system.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const srcDir = path.join(rootDir, 'src');

// ANSI color codes for terminal output
const colors = {
  blue: '\x1b[34m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  reset: '\x1b[0m'
};

console.log(`${colors.blue}Cleaning compiled JavaScript files...${colors.reset}`);

// Check if src directory exists
if (!fs.existsSync(srcDir)) {
  console.log(`${colors.yellow}Source directory doesn't exist. Nothing to clean.${colors.reset}`);
  process.exit(0);
}

// Get all JS files in the src directory
try {
  const files = fs.readdirSync(srcDir);
  let deletedCount = 0;
  
  for (const file of files) {
    if (file.endsWith('.js')) {
      const filePath = path.join(srcDir, file);
      
      try {
        fs.unlinkSync(filePath);
        console.log(`${colors.yellow}Deleted: ${filePath}${colors.reset}`);
        deletedCount++;
      } catch (deleteError) {
        console.error(`${colors.red}Failed to delete ${filePath}: ${deleteError.message}${colors.reset}`);
      }
    }
  }
  
  if (deletedCount > 0) {
    console.log(`${colors.green}Deleted ${deletedCount} JavaScript file(s).${colors.reset}`);
  } else {
    console.log(`${colors.yellow}No JavaScript files found to delete.${colors.reset}`);
  }
} catch (error) {
  console.error(`${colors.red}Error cleaning files: ${error.message}${colors.reset}`);
  process.exit(1);
} 