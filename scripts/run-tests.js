#!/usr/bin/env node

/**
 * Script to run tests with Bun if available, otherwise with Node.js
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

// Run tests
function runTests() {
  const args = process.argv.slice(2);
  const testDir = path.join(rootDir, 'src', 'test');
  
  // If we're already running in Bun, we can just import the test files directly
  if (isBunRuntime) {
    console.log('Already running in Bun, executing tests directly...');
    
    // Get all test files
    const testFiles = [];
    function collectTestFiles(dir) {
      const files = fs.readdirSync(dir, { withFileTypes: true });
      for (const file of files) {
        const fullPath = path.join(dir, file.name);
        if (file.isDirectory()) {
          collectTestFiles(fullPath);
        } else if (file.name.endsWith('.test.js')) {
          testFiles.push(fullPath);
        }
      }
    }
    
    try {
      collectTestFiles(testDir);
      
      // Import and run each test file
      Promise.all(testFiles.map(file => import(file)))
        .then(() => {
          console.log('All tests completed');
        })
        .catch(error => {
          console.error('Error running tests:', error);
          process.exit(1);
        });
    } catch (error) {
      console.error('Error collecting test files:', error);
      process.exit(1);
    }
  }
  // Otherwise, if Bun is available, spawn a new Bun process
  else if (isBunAvailable()) {
    console.log('Running tests with Bun...');
    
    // Determine test arguments
    const testArgs = ['test', testDir];
    
    // Add any additional arguments
    if (args.includes('--watch')) {
      testArgs.push('--watch');
    }
    
    if (args.includes('--coverage')) {
      testArgs.push('--coverage');
    }
    
    if (args.includes('--verbose')) {
      testArgs.push('--verbose');
    }
    
    // Run tests with Bun
    const bunProcess = spawn('bun', testArgs, {
      stdio: 'inherit',
      cwd: rootDir
    });
    
    bunProcess.on('close', (code) => {
      process.exit(code);
    });
  } else {
    console.log('Bun not available. Tests require Bun to run.');
    console.log('Please install Bun: https://bun.sh/docs/installation');
    process.exit(1);
  }
}

runTests(); 