#!/usr/bin/env node

/**
 * WebDAV Backup - Command Line interface
 * 
 * This script detects the runtime environment and executes the appropriate version
 * of the tool based on whether it's running under Bun or Node.js.
 */

import { spawn } from 'child_process';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try to execute with Bun first for better performance
try {
  const args = process.argv.slice(2);
  const binPath = path.resolve(__dirname, 'bin.ts');
  
  // Attempt to launch using Bun runtime
  const bunProcess = spawn('bun', [binPath, ...args], { 
    stdio: 'inherit',
    shell: process.platform === 'win32' // Use shell on Windows for better PATH resolution
  });
  
  // Forward exit code
  bunProcess.on('exit', (code) => {
    process.exit(code || 0);
  });
  
  // Handle errors (like Bun not being installed)
  bunProcess.on('error', () => {
    console.log('Bun not detected, falling back to Node.js...');
    // Instead of trying to import directly, we'll execute the module using Node.js
    import('./bin.ts').catch(err => {
      console.error('Failed to start application:', err);
      process.exit(1);
    });
  });
} catch (error) {
  console.error('Error launching application:', error);
  process.exit(1);
} 