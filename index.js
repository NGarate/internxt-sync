#!/usr/bin/env node

/**
 * Internxt Sync - Universal Entry Point
 * 
 * This file automatically detects the runtime environment (Bun or Node.js)
 * and runs the appropriate version of the uploader script.
 */

// Detect if running in Bun environment
const isBun = typeof process !== 'undefined' && 
              typeof process.versions !== 'undefined' && 
              typeof process.versions.bun !== 'undefined';

// Import required modules using ES module syntax
import fs from 'fs';
import path from 'path';
import { execSync, spawn } from 'child_process';
import { fileURLToPath } from 'url';

// Get the directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use ANSI colors for terminal output
const colors = {
  blue: '\x1b[34m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  reset: '\x1b[0m'
};

// Detect platform
const isWindows = process.platform === 'win32';
const isMac = process.platform === 'darwin';
const isLinux = process.platform === 'linux';
const platformName = isWindows ? 'Windows' : (isMac ? 'macOS' : (isLinux ? 'Linux' : 'Unknown'));

console.log(`${colors.blue}Internxt Sync - Universal Entry Point${colors.reset}`);
console.log(`${colors.blue}Detected runtime: ${isBun ? 'Bun' : 'Node.js'} on ${platformName}${colors.reset}`);

// Define file paths
const srcDir = path.join(__dirname, 'src');
const tsMainFile = path.join(__dirname, 'internxt-sync.ts');
const jsMainFile = path.join(srcDir, 'internxt-sync.js');

// Check if the required files/directories exist
const tsExists = fs.existsSync(tsMainFile);
const jsExists = fs.existsSync(jsMainFile);
const srcDirExists = fs.existsSync(srcDir);

if (!srcDirExists && !tsExists) {
  console.error(`${colors.red}Error: Neither source directory (${srcDir}) nor original TypeScript file (${tsMainFile}) found.${colors.reset}`);
  console.error(`${colors.red}Please make sure the project is properly installed.${colors.reset}`);
  process.exit(1);
}

// Make sure the scripts directory exists
const scriptsDir = path.join(__dirname, 'scripts');
if (!fs.existsSync(scriptsDir)) {
  fs.mkdirSync(scriptsDir, { recursive: true });
}

if (isBun) {
  // If Bun is available, prefer running the TypeScript file directly if it exists
  if (tsExists) {
    console.log(`${colors.blue}Running TypeScript file directly with Bun...${colors.reset}`);
    
    try {
      // Use a direct path import with Bun for cross-platform compatibility
      const args = process.argv.slice(2);
      
      if (isWindows) {
        console.log(`${colors.blue}Using Windows-compatible execution for Bun...${colors.reset}`);
        
        // Import the TypeScript file directly on Windows
        import(tsMainFile)
          .then((module) => {
            module.default();
          })
          .catch((error) => {
            console.error(`${colors.red}Error importing TypeScript directly: ${error.message}${colors.reset}`);
            if (jsExists) {
              console.log(`${colors.yellow}Falling back to JavaScript version...${colors.reset}`);
              runJavaScriptVersion();
            } else {
              process.exit(1);
            }
          });
      } else {
        // For non-Windows platforms, use spawn as before
        const bunProcess = spawn('bun', [tsMainFile, ...args], {
          stdio: 'inherit',
          cwd: __dirname
        });
        
        bunProcess.on('close', (code) => {
          process.exit(code);
        });
      }
    } catch (error) {
      console.error(`${colors.red}Error running TypeScript with Bun: ${error.message}${colors.reset}`);
      // Try to fall back to the JS version
      if (jsExists) {
        console.log(`${colors.yellow}Falling back to JavaScript version...${colors.reset}`);
        runJavaScriptVersion();
      } else {
        process.exit(1);
      }
    }
  } else if (jsExists) {
    // If no TypeScript file but JavaScript exists, run that
    console.log(`${colors.blue}Running JavaScript version with Bun...${colors.reset}`);
    runJavaScriptVersion();
  } else {
    console.error(`${colors.red}Error: No suitable entry point found.${colors.reset}`);
    process.exit(1);
  }
} else {
  // Using Node.js - always run the JavaScript version
  if (!jsExists) {
    console.log(`${colors.yellow}JavaScript module not found. Checking if it needs to be compiled...${colors.reset}`);
    
    if (tsExists) {
      try {
        // Check if Bun is installed for compilation
        let bunInstalled = false;
        
        try {
          // Use a command that works on all platforms
          const bunCheckCmd = isWindows ? 'where bun' : 'which bun';
          execSync(bunCheckCmd, { stdio: 'ignore' });
          bunInstalled = true;
        } catch (bunNotFoundError) {
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
          console.log(`${colors.blue}Compiling source files using Bun...${colors.reset}`);
          
          // Create source directory if it doesn't exist
          if (!srcDirExists) {
            fs.mkdirSync(srcDir, { recursive: true });
          }
          
          // Compile the TypeScript to JavaScript
          execSync(`bun build "${tsMainFile}" --outdir "${srcDir}" --target node --external chalk --minify`, {
            stdio: 'inherit',
            cwd: __dirname
          });
          
          if (fs.existsSync(jsMainFile)) {
            console.log(`${colors.green}Compilation successful!${colors.reset}`);
          } else {
            throw new Error('Compilation did not produce the expected output file');
          }
        } else {
          console.error(`${colors.red}Error: Bun is not installed and JavaScript version is missing.${colors.reset}`);
          console.error(`${colors.red}Please install Bun:${colors.reset}`);
          
          if (isWindows) {
            console.error(`${colors.yellow}For Windows, visit: https://bun.sh/docs/installation${colors.reset}`);
            console.error(`${colors.yellow}or use PowerShell: powershell -c "irm bun.sh/install.ps1|iex"${colors.reset}`);
          } else if (isMac || isLinux) {
            console.error(`${colors.yellow}For macOS/Linux: curl -fsSL https://bun.sh/install | bash${colors.reset}`);
          } else {
            console.error(`${colors.yellow}Visit https://bun.sh/docs/installation for instructions.${colors.reset}`);
          }
          
          console.error(`${colors.yellow}After installing Bun, run: bun build internxt-sync.ts --outdir src --target node --external chalk --minify${colors.reset}`);
          process.exit(1);
        }
      } catch (compileError) {
        console.error(`${colors.red}Failed to compile: ${compileError.message}${colors.reset}`);
        process.exit(1);
      }
    } else {
      console.error(`${colors.red}Error: No source files found to run or compile.${colors.reset}`);
      process.exit(1);
    }
  }
  
  runJavaScriptVersion();
}

/**
 * Run the JavaScript version of the uploader
 */
function runJavaScriptVersion() {
  try {
    // Import the main module dynamically
    import('./src/internxt-sync.js')
      .then(module => {
        // Run the main function
        module.default();
      })
      .catch(error => {
        console.error(`${colors.red}Error importing JavaScript module: ${error.message}${colors.reset}`);
        console.error(error);
        process.exit(1);
      });
  } catch (error) {
    console.error(`${colors.red}Error running JavaScript version: ${error.message}${colors.reset}`);
    process.exit(1);
  }
} 