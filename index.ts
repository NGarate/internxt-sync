#!/usr/bin/env node

/**
 * Universal Entry Point for Internxt Sync
 * 
 * This file automatically detects the runtime environment and runs the appropriate version:
 * - In Bun: Directly runs the TypeScript file for maximum performance
 * - In Node.js: Runs the pre-compiled JavaScript version
 * 
 * The detection and execution are transparent to the end user.
 */

import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { execSync, spawn, ChildProcess } from 'child_process';

// Get the directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI color codes for better terminal output
const colors = {
  blue: '\x1b[34m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  reset: '\x1b[0m'
};

// Check if we're running in Bun
const isBunRuntime = typeof process !== 'undefined' && 
                     typeof process.versions !== 'undefined' && 
                     'bun' in process.versions;

// Check if Bun is installed (even if we're not running in it)
function isBunAvailable(): boolean {
  try {
    execSync('bun --version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

// Main function to run the appropriate version
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const tsFile = path.join(__dirname, 'internxt-sync.ts');
  const jsFile = path.join(__dirname, 'dist', 'internxt-sync.js');
  
  try {
    // CASE 1: Running in Bun - use TypeScript directly
    if (isBunRuntime) {
      if (fs.existsSync(tsFile)) {
        try {
          const module = await import('./internxt-sync.ts');
          if (typeof module.default === 'function') {
            return module.default();
          } else {
            throw new Error('TypeScript module does not export a default function');
          }
        } catch (error: any) {
          console.error(`${colors.red}Error running TypeScript directly: ${error.message}${colors.reset}`);
          // Fall back to JS if TS fails
          if (fs.existsSync(jsFile)) {
            console.log(`${colors.yellow}Falling back to JavaScript version...${colors.reset}`);
            return runJavaScriptVersion();
          }
          throw error;
        }
      }
    }
    
    // CASE 2: Not in Bun runtime but Bun is available - spawn Bun process
    if (!isBunRuntime && isBunAvailable() && fs.existsSync(tsFile)) {
      console.log(`${colors.blue}Bun detected, using it to run TypeScript directly...${colors.reset}`);
      
      return new Promise((resolve, reject) => {
        const bunProcess: ChildProcess = spawn('bun', [tsFile, ...args], {
          stdio: 'inherit',
          cwd: __dirname
        });
        
        bunProcess.on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            // If Bun execution fails, try JavaScript version
            if (fs.existsSync(jsFile)) {
              console.log(`${colors.yellow}Bun execution failed, falling back to JavaScript...${colors.reset}`);
              runJavaScriptVersion().then(resolve).catch(reject);
            } else {
              reject(new Error(`Process exited with code ${code}`));
            }
          }
        });
      });
    }
    
    // CASE 3: Default - run JavaScript version
    return runJavaScriptVersion();
    
  } catch (error: any) {
    console.error(`${colors.red}Error running application: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Helper function to run the JavaScript version
async function runJavaScriptVersion(): Promise<void> {
  const jsFile = path.join(__dirname, 'dist', 'internxt-sync.js');
  
  if (fs.existsSync(jsFile)) {
    try {
      const module = await import('./dist/internxt-sync.js');
      if (typeof module.default === 'function') {
        return module.default();
      } else {
        throw new Error('JavaScript module does not export a default function');
      }
    } catch (error: any) {
      console.error(`${colors.red}Error importing JavaScript module: ${error.message}${colors.reset}`);
      throw error;
    }
  } else {
    // If JS file doesn't exist, try to build it if we have Bun
    if (isBunAvailable() && fs.existsSync(path.join(__dirname, 'internxt-sync.ts'))) {
      console.log(`${colors.yellow}JavaScript version not found, attempting to build it...${colors.reset}`);
      
      try {
        execSync('bun build internxt-sync.ts --outdir dist --target node --external chalk,webdav', {
          stdio: 'inherit',
          cwd: __dirname
        });
        
        if (fs.existsSync(jsFile)) {
          console.log(`${colors.green}Build successful, running JavaScript version...${colors.reset}`);
          return runJavaScriptVersion();
        }
      } catch (buildError: any) {
        console.error(`${colors.red}Failed to build JavaScript version: ${buildError.message}${colors.reset}`);
      }
    }
    
    throw new Error('Could not find or build a runnable version of the application');
  }
}

// Run the application
main().catch(error => {
  console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
  process.exit(1);
}); 