#!/usr/bin/env node

/**
 * Script to run the application with Bun if available, otherwise with Node.js
 */

import { execSync, spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

// Get the directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

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

// Run the application
function runApp() {
  const args = process.argv.slice(2);
  
  // If we're already running in Bun, we can just import the TypeScript file directly
  if (isBunRuntime) {
    console.log('Already running in Bun, executing TypeScript directly...');
    const tsFile = path.join(rootDir, 'src', 'main', 'file-sync.ts');
    
    if (fs.existsSync(tsFile)) {
      import(tsFile)
        .then(module => {
          if (typeof module.default === 'function') {
            module.default();
          } else {
            console.error('Error: TypeScript module does not export a default function');
            process.exit(1);
          }
        })
        .catch(error => {
          console.error('Error importing TypeScript module:', error);
          process.exit(1);
        });
    } else {
      console.error('Error: TypeScript file not found');
      process.exit(1);
    }
  }
  // Otherwise, if Bun is available, spawn a new Bun process
  else if (isBunAvailable()) {
    console.log('Using Bun runtime...');
    const tsFile = path.join(rootDir, 'src', 'main', 'file-sync.ts');
    
    if (fs.existsSync(tsFile)) {
      // Run TypeScript file directly with Bun
      const bunProcess = spawn('bun', [tsFile, ...args], {
        stdio: 'inherit',
        cwd: rootDir
      });
      
      bunProcess.on('close', (code) => {
        process.exit(code);
      });
    } else {
      console.log('TypeScript file not found, falling back to JavaScript...');
      runWithNode();
    }
  } else {
    console.log('Bun not available, using Node.js...');
    runWithNode();
  }
}

// Run with Node.js
function runWithNode() {
  const args = process.argv.slice(2);
  const jsFile = path.join(rootDir, 'dist', 'file-sync.js');
  
  if (fs.existsSync(jsFile)) {
    // Import the JavaScript module
    import(jsFile)
      .then(module => {
        if (typeof module.default === 'function') {
          module.default();
        } else {
          console.error('Error: Module does not export a default function');
          process.exit(1);
        }
      })
      .catch(error => {
        console.error('Error importing module:', error);
        process.exit(1);
      });
  } else {
    console.error('Error: JavaScript module not found');
    process.exit(1);
  }
}

runApp(); 