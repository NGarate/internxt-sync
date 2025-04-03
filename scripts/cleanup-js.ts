#!/usr/bin/env bun

/**
 * Cleanup script for Internxt WebDAV Uploader
 * Removes all JavaScript files from the src directory since we're using TypeScript directly with Bun
 */

import path from 'path';
import { readdirSync, statSync, unlinkSync } from 'fs';
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

console.log(`${colors.blue}Cleaning up JavaScript files from ${srcDir}...${colors.reset}`);

// Function to recursively find all JavaScript files
function findJsFiles(dir: string): string[] {
  let results: string[] = [];
  
  const entries = readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      // Recursively search subdirectories
      results = results.concat(findJsFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      // Add JavaScript files to the list
      results.push(fullPath);
    }
  }
  
  return results;
}

// Find and delete all JavaScript files in the src directory
try {
  const jsFiles = findJsFiles(srcDir);
  console.log(`${colors.yellow}Found ${jsFiles.length} JavaScript files to delete.${colors.reset}`);
  
  let deletedCount = 0;
  
  for (const file of jsFiles) {
    try {
      unlinkSync(file);
      console.log(`${colors.green}Deleted: ${file}${colors.reset}`);
      deletedCount++;
    } catch (error) {
      console.error(`${colors.red}Failed to delete ${file}: ${error instanceof Error ? error.message : String(error)}${colors.reset}`);
    }
  }
  
  console.log(`${colors.blue}Successfully deleted ${deletedCount} of ${jsFiles.length} JavaScript files.${colors.reset}`);
} catch (error) {
  console.error(`${colors.red}Error searching for JavaScript files: ${error instanceof Error ? error.message : String(error)}${colors.reset}`);
  process.exit(1);
}

console.log(`${colors.blue}Cleanup completed!${colors.reset}`); 