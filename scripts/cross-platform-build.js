#!/usr/bin/env node

/**
 * Cross-platform build script for Internxt Sync
 * 
 * This script builds the TypeScript source into JavaScript that can run in Node.js.
 * It tries to use Bun first for faster builds, then falls back to other methods if needed.
 */

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

// Get the directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// ANSI color codes for better terminal output
const colors = {
  blue: '\x1b[34m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  reset: '\x1b[0m'
};

// Check if Bun is available
function isBunAvailable() {
  try {
    execSync('bun --version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

// Check if we're running in Bun
const isBunRuntime = typeof process !== 'undefined' && 
                     typeof process.versions !== 'undefined' && 
                     typeof process.versions.bun !== 'undefined';

// Main build function
function build() {
  const srcDir = path.join(rootDir, 'src');
  const tsFile = path.join(rootDir, 'internxt-sync.ts');
  
  // Create src directory if it doesn't exist
  if (!fs.existsSync(srcDir)) {
    fs.mkdirSync(srcDir, { recursive: true });
  }
  
  // Check if TypeScript file exists
  if (!fs.existsSync(tsFile)) {
    console.error(`${colors.red}Error: TypeScript file not found at ${tsFile}${colors.reset}`);
    process.exit(1);
  }
  
  console.log(`${colors.blue}Building Internxt Sync...${colors.reset}`);
  
  try {
    // Try to build with Bun first (fastest)
    if (isBunAvailable()) {
      console.log(`${colors.blue}Using Bun to build...${colors.reset}`);
      
      execSync(`bun build "${tsFile}" --outdir "${srcDir}" --target node --external chalk`, {
        stdio: 'inherit',
        cwd: rootDir
      });
      
      console.log(`${colors.green}Build completed successfully!${colors.reset}`);
      return;
    }
    
    // If Bun is not available, show instructions
    console.log(`${colors.yellow}Bun is not available. For faster builds, consider installing Bun:${colors.reset}`);
    console.log(`${colors.yellow}https://bun.sh/docs/installation${colors.reset}`);
    
    // TODO: Add fallback build method if needed (e.g., using tsc or esbuild)
    console.error(`${colors.red}No suitable build tool found. Please install Bun.${colors.reset}`);
    process.exit(1);
    
  } catch (error) {
    console.error(`${colors.red}Build failed: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Run the build
build(); 