#!/bin/sh
":" //# comment; exec /usr/bin/env bun "$0" "$@" || exec /usr/bin/env node "$0" "$@" || echo "Neither Bun nor Node.js is installed" >&2; exit 1 #

// The above is a polyglot shebang that works in all environments:
// - In shell: executes as shell script and tries bun then node
// - In JavaScript: reads as string literal followed by comment
// - In Windows: reads as JavaScript with shell part as comment

// Main function to run the application 
async function main() {
  // Check if we have Bun before trying to load anything
  const isBun = typeof process !== 'undefined' && 
                typeof globalThis.Bun !== 'undefined';

  if (isBun) {
    // Using Bun runtime - directly execute TypeScript
    try {
      const { fileURLToPath, pathToFileURL } = await import('url');
      const path = await import('path');
      
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      
      // Load the TypeScript file with proper path resolution
      const tsPath = path.join(__dirname, 'src/main/file-sync.ts');
      const tsPathUrl = pathToFileURL(tsPath).href;
      
      await import(tsPathUrl).catch(err => {
        console.error('Failed to load Bun entry point:', err);
        process.exit(1);
      });
    } catch (error) {
      console.error('Failed to resolve paths:', error);
      process.exit(1);
    }
  } else {
    // Using Node.js runtime - load compiled JavaScript
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
  }
}

// Execute if this is the main module
if (typeof require !== 'undefined' && require.main === module || 
    typeof import.meta !== 'undefined' && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
} 