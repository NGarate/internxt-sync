#!/usr/bin/env node

/**
 * WebDAV Backup - Universal Entry Point
 * 
 * This serves as the main executable for the WebDAV Backup tool.
 * It automatically detects the runtime (Node.js or Bun) and uses the appropriate module.
 */

import * as path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

// Get current file information for path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// Detect if running in Bun
const isBun = typeof process !== 'undefined' && 
              // @ts-ignore - Bun specific global
              typeof Bun !== 'undefined';

// Log runtime information
if (isBun) {
  console.log("Using Bun runtime");
} else {
  console.log("Using Node.js runtime");
}

// Set global flag to indicate runtime
// @ts-ignore
globalThis.isBunRuntime = isBun;

// Directly import the appropriate module based on runtime
async function main() {
  try {
    if (isBun) {
      // Import the Bun-optimized version
      const bunEntryPath = path.join(ROOT_DIR, 'dist/bun/file-sync.js');
      console.log(`Loading Bun entry point: ${bunEntryPath}`);
      await import(bunEntryPath);
    } else {
      // Import the Node.js version with proper URL conversion for cross-platform compatibility
      const nodePath = path.join(ROOT_DIR, 'dist/node/file-sync.js');
      console.log(`Loading Node.js entry point: ${nodePath}`);
      
      // Convert to file:// URL for Node.js ESM compatibility
      const nodePathUrl = pathToFileURL(nodePath).href;
      await import(nodePathUrl);
    }
  } catch (error) {
    console.error("Error importing entry point:", error);
    process.exit(1);
  }
}

// Start the application
main().catch(error => {
  console.error("Unexpected error:", error);
  process.exit(1);
}); 