#!/usr/bin/env bun

/**
 * Clean script for Internxt WebDAV Uploader
 * Handles cleaning compiled files and build outputs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const srcDir = path.join(rootDir, 'src');

// ANSI color codes for terminal output
const colors = {
  blue: '\x1b[34m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  reset: '\x1b[0m'
};

// Make console output more informative
console.log(`${colors.blue}Clean script running from: ${__dirname}${colors.reset}`);
console.log(`${colors.blue}Root directory: ${rootDir}${colors.reset}`);
console.log(`${colors.blue}Cleaning build outputs...${colors.reset}`);

// Function to delete directory recursively
function deleteDirRecursive(dir: string): void {
  if (fs.existsSync(dir)) {
    fs.readdirSync(dir).forEach((file) => {
      const curPath = path.join(dir, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        // Recursive call for directories
        deleteDirRecursive(curPath);
      } else {
        // Delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(dir);
  }
}

// Clean dist directory
try {
  if (fs.existsSync(distDir)) {
    deleteDirRecursive(distDir);
    console.log(`${colors.green}Deleted dist directory${colors.reset}`);
  } else {
    console.log(`${colors.yellow}Dist directory doesn't exist. Nothing to clean.${colors.reset}`);
  }
} catch (error) {
  console.error(`${colors.red}Error cleaning dist directory: ${error instanceof Error ? error.message : String(error)}${colors.reset}`);
}

// Clean compiled JS files from TS files in src
try {
  const tsFiles = findTsFiles(srcDir);
  let deletedCount = 0;
  
  for (const tsFile of tsFiles) {
    const jsFile = tsFile.replace('.ts', '.js');
    const jsMapFile = `${jsFile}.map`;
    const dtsFile = tsFile.replace('.ts', '.d.ts');
    
    // Delete JS file if it exists
    if (fs.existsSync(jsFile)) {
      fs.unlinkSync(jsFile);
      deletedCount++;
    }
    
    // Delete sourcemap if it exists
    if (fs.existsSync(jsMapFile)) {
      fs.unlinkSync(jsMapFile);
      deletedCount++;
    }
    
    // Delete type definitions if they exist
    if (fs.existsSync(dtsFile)) {
      fs.unlinkSync(dtsFile);
      deletedCount++;
    }
  }
  
  if (deletedCount > 0) {
    console.log(`${colors.green}Deleted ${deletedCount} compiled files.${colors.reset}`);
  } else {
    console.log(`${colors.yellow}No compiled files found to delete.${colors.reset}`);
  }
} catch (error) {
  console.error(`${colors.red}Error cleaning compiled files: ${error instanceof Error ? error.message : String(error)}${colors.reset}`);
}

// Function to find all TypeScript files in a directory and its subdirectories
function findTsFiles(dir: string): string[] {
  let results: string[] = [];
  
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        // Recursively search directories
        results = results.concat(findTsFiles(filePath));
      } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
        // Add TypeScript files (but not declaration files)
        results.push(filePath);
      }
    }
  }
  
  return results;
}

console.log(`${colors.blue}Clean completed successfully${colors.reset}`); 