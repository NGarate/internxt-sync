#!/usr/bin/env node

/**
 * WebDAV File Sync CLI Universal Entry Point
 * 
 * This TypeScript file is the source for both Bun and Node.js executables.
 * It detects and uses the appropriate runtime.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Native detection of Bun runtime
const isBun = typeof process !== 'undefined' && 
              // @ts-ignore - Bun specific global
              typeof Bun !== 'undefined';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// The parent directory of dist when running from dist/bin.js
// This resolves to the project root
const ROOT_DIR = path.resolve(__dirname, '..');

// Imports that work in both Bun and Node
let spawn = (command: string, args: string[], options: Record<string, any>): any => {
  throw new Error('Child process module not available');
};
let execSync = (command: string, options: Record<string, any>): any => {
  throw new Error('Child process module not available');
};

// Dynamically import child_process to avoid bundling issues with Bun
try {
  const childProcess = await import('child_process');
  // @ts-ignore
  spawn = childProcess.spawn;
  // @ts-ignore
  execSync = childProcess.execSync;
} catch (e) {
  console.error('Failed to import child_process module');
}

// Try to determine how this package was installed
function detectInstallationMethod(): 'bun' | 'node' {
  // If Bun is detected, just use Bun
  if (isBun) {
    return 'bun';
  }
  
  try {
    // Get the path to our package
    const packagePath = ROOT_DIR;
    
    // Look for npm/yarn/pnpm lock files in parent directories
    let currentDir = packagePath;
    const maxLevels = 4; // Don't go too deep up the directory tree
    
    for (let i = 0; i < maxLevels; i++) {
      // If we find a bun.lockb in a parent directory, it was probably installed with Bun
      if (fs.existsSync(path.join(currentDir, 'bun.lockb'))) {
        return 'bun';
      }
      
      // If we find Node.js specific lockfiles, it was probably installed with npm/yarn/pnpm
      if (
        fs.existsSync(path.join(currentDir, 'package-lock.json')) || 
        fs.existsSync(path.join(currentDir, 'yarn.lock')) ||
        fs.existsSync(path.join(currentDir, 'pnpm-lock.yaml'))
      ) {
        return 'node';
      }
      
      // Move up one directory
      const parentDir = path.dirname(currentDir);
      if (parentDir === currentDir) {
        break; // We've reached the root
      }
      currentDir = parentDir;
    }
    
    // If we're in a global installation and can't determine by lockfiles
    // Check if it's in a directory that suggests which package manager was used
    if (packagePath.includes('bun') || packagePath.includes('.bun')) {
      return 'bun';
    }
    
    // For global npm/yarn/pnpm installations
    if (packagePath.includes('node_modules')) {
      return 'node';
    }
    
    // Default to checking if Bun exists in PATH
    try {
      execSync('bun --version', { stdio: 'ignore' });
      return 'bun';
    } catch (e) {
      // Bun isn't available, default to Node
      return 'node';
    }
  } catch (error) {
    console.error('Error detecting installation method:', error);
    // Default to Node if we can't determine
    return 'node';
  }
}

async function main() {
  // If we're already running in Bun, just import the Bun entry point directly
  if (isBun) {
    console.log("Detected native Bun runtime");
    const bunPath = path.join(ROOT_DIR, 'dist/bun/file-sync.js');
    console.log(`Loading Bun entry point: ${bunPath}`);
    await import(bunPath);
    return;
  }
  
  // Otherwise, determine which runtime to use
  const runtime = detectInstallationMethod();

  // Launch the appropriate runtime version
  if (runtime === 'bun') {
    console.log("Using Bun runtime (detected from installation method)");
    
    try {
      // Spawn a Bun process to run the Bun-specific entry point
      const bunEntryPoint = path.join(ROOT_DIR, 'dist/bun/file-sync.js');
      console.log(`Loading Bun entry point: ${bunEntryPoint}`);
      
      const bunProcess = spawn('bun', [bunEntryPoint, ...process.argv.slice(2)], {
        stdio: 'inherit',
        cwd: process.cwd()
      });
      
      // Handle process exit
      bunProcess.on('exit', (code: number | null) => {
        process.exit(code ?? 0);
      });
    } catch (error) {
      console.error("Failed to run with Bun:", error);
      console.log("Falling back to Node.js runtime");
      // Fall back to Node.js if Bun execution fails
      await loadNodeVersion();
    }
  } else {
    console.log("Using Node.js runtime (detected from installation method)");
    await loadNodeVersion();
  }
}

// Function to load the Node.js version
async function loadNodeVersion() {
  try {
    // Dynamic import of the Node-specific bundle
    const nodePath = path.join(ROOT_DIR, 'dist/node/file-sync.js');
    console.log(`Loading Node.js entry point: ${nodePath}`);
    await import(nodePath);
  } catch (error) {
    console.error("Error loading Node.js version:", error);
    process.exit(1);
  }
}

// Start the application
main().catch(error => {
  console.error("Unexpected error:", error);
  process.exit(1);
}); 