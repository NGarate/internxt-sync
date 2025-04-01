#!/usr/bin/env node

/**
 * Cross-platform build script for Internxt Sync
 * This script handles building the project on any operating system.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Get the directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const srcDir = path.join(rootDir, 'src');
const isWindows = process.platform === 'win32';

// ANSI color codes for terminal output
const colors = {
  blue: '\x1b[34m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  reset: '\x1b[0m'
};

console.log(`${colors.blue}Building Internxt Sync...${colors.reset}`);

// Create src directory if it doesn't exist
if (!fs.existsSync(srcDir)) {
  console.log(`${colors.yellow}Creating src directory...${colors.reset}`);
  fs.mkdirSync(srcDir, { recursive: true });
}

// Check if Bun is installed
let bunInstalled = false;

try {
  // Use a command that works on all platforms
  const command = isWindows ? 'where bun' : 'which bun';
  execSync(command, { stdio: 'ignore' });
  bunInstalled = true;
} catch (error) {
  // Try an alternative check for Windows
  if (isWindows) {
    try {
      execSync('bun --version', { stdio: 'ignore' });
      bunInstalled = true;
    } catch (e) {
      bunInstalled = false;
    }
  } else {
    bunInstalled = false;
  }
}

if (bunInstalled) {
  console.log(`${colors.green}Bun detected. Building with Bun...${colors.reset}`);
  try {
    // Create a cross-platform build command
    const sourceFile = path.join(rootDir, 'internxt-sync.ts');
    const buildCmd = `bun build "${sourceFile}" --outdir "${srcDir}" --target node --external chalk --minify`;
    
    execSync(buildCmd, {
      stdio: 'inherit',
      cwd: rootDir
    });
    
    console.log(`${colors.green}Build completed successfully!${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}Build failed: ${error.message}${colors.reset}`);
    process.exit(1);
  }
} else {
  console.log(`${colors.yellow}Bun not found. Please install Bun for best performance:${colors.reset}`);
  console.log(`${colors.yellow}Visit https://bun.sh/ for installation instructions.${colors.reset}`);
  
  // Check if we have a compiled JavaScript file already
  const jsFile = path.join(srcDir, 'internxt-sync.js');
  if (fs.existsSync(jsFile)) {
    console.log(`${colors.green}Using existing compiled JavaScript file.${colors.reset}`);
  } else {
    console.error(`${colors.red}Bun is required for initial compilation. Please install Bun and try again.${colors.reset}`);
    process.exit(1);
  }
} 