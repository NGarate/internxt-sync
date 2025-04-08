#!/usr/bin/env sh
":" //# > /dev/null 2>&1; exec /usr/bin/env bun --bun "$0" "$@" || exec /usr/bin/env node "$0" "$@" || echo "Bun and Node.js are not installed. Please install one of them to run this script." >&2; exit 1 #

/*
 * WebDAV Backup - Universal Entry Point
 *
 * This script auto-detects the runtime and adapts accordingly.
 * Works on all platforms including Windows, Linux, and macOS.
 * Supports being loaded directly or required as a module.
 */

// If this file is being required (like in our Windows wrapper), execute it
if (typeof require !== 'undefined' && require.main !== module) {
  // Being required as a module, export a function that starts the app
  module.exports = runApp;
} else {
  // Being executed directly
  runApp();
}

// Main function to run the application 
function runApp() {
  // Check if we have Bun before trying to load anything
  const isBun = typeof process !== 'undefined' && 
                typeof globalThis.Bun !== 'undefined';

  if (isBun) {
    // Using Bun runtime - directly execute TypeScript
    import('./src/main/file-sync.ts').catch(err => {
      console.error('Failed to load Bun entry point:', err);
      process.exit(1);
    });
  } else {
    // Using Node.js runtime - load compiled JavaScript
    (async () => {
      try {
        const { fileURLToPath, pathToFileURL } = await import('url');
        const path = await import('path');
        
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        
        // Load the Node.js compatible version
        const nodePath = path.join(__dirname, 'dist/node/file-sync.js');
        const nodePathUrl = pathToFileURL(nodePath).href;
        
        // Set runtime flag
        globalThis.isBunRuntime = false;
        
        // Import and execute
        const { default: app } = await import(nodePathUrl);
        app();
      } catch (error) {
        console.error("Failed to load Node.js entry point:", error);
        process.exit(1);
      }
    })();
  }
} 