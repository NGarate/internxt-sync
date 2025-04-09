#!/usr/bin/env bun
/**
 * Installation helper script for webdav-backup
 * This script helps properly set up the package when installed globally
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

// Get the directory of the current file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log(`
╔═══════════════════════════════════════════════════╗
║            WebDAV Backup Installation             ║
╚═══════════════════════════════════════════════════╝
`);

console.log("Installation directory:", __dirname);

// Check if this is a global installation
const isGlobalInstall = __dirname.includes('node_modules') || 
                       __dirname.includes('.bun') || 
                       process.env.npm_config_global === 'true';

// Get the global bin directory for bun if possible
let globalBinDir = null;
try {
  globalBinDir = execSync('bun pm bin --global', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  console.log("Global bin directory:", globalBinDir);
} catch (e) {
  console.log("Could not determine global bin directory");
}

if (isGlobalInstall) {
  console.log("Detected global installation");
  console.log("Ensuring all necessary files are properly installed...");
  
  // Check if src directory exists
  const srcDir = path.join(__dirname, 'src');
  if (!fs.existsSync(srcDir)) {
    console.error(`Error: The 'src' directory is missing. This is likely a global installation issue.`);
    console.log(`
To use WebDAV Backup globally, try one of these solutions:
1. Install manually with: bun install -g .
   (from the project directory)
2. Run without installing: bunx webdav-backup
3. Clone the repo and use npm link: git clone <repo-url> && cd <repo-dir> && npm link
`);
  } else {
    console.log("✓ Source files found");
    
    // Check specifically for the file-sync module
    const fileSyncPath = path.join(srcDir, 'main', 'file-sync.ts');
    if (fs.existsSync(fileSyncPath)) {
      console.log("✓ Main module found");
    } else {
      console.error(`Error: The main module file (${fileSyncPath}) is missing.`);
    }
    
    console.log(`
WebDAV Backup installed successfully!

Usage:
  webdav-backup <source-dir> --webdav-url=<url>

For help:
  webdav-backup --help
`);
  }
} else {
  console.log("Local installation detected");
  console.log(`
WebDAV Backup installed locally!

To start using it:
  bun index.ts <source-dir> --webdav-url=<url>

For help:
  bun index.ts --help
`);
} 