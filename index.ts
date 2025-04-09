#!/usr/bin/env bun
/**
 * webdav-backup CLI
 * A simple, fast CLI for backing up files to WebDAV servers
 */

import { parseArgs } from "node:util";
import { basename, dirname, resolve, join } from "node:path";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import chalk from "chalk";

// Get the directory of the current file for proper path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read version from package.json, with fallback
const packageJsonPath = resolve(__dirname, "./package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
const VERSION = packageJson.version;

// Try to import the syncFiles function with different path strategies
async function importSyncModule() {
  const possiblePaths = [
    // Using import maps (preferred for newer Node.js/Bun versions)
    "#src/main/file-sync",
    // Standard relative path for local development
    "./src/main/file-sync",
    // Absolute path based on the current file's location
    join(__dirname, "src/main/file-sync"),
    // For npm/bun global installations
    join(__dirname, "../src/main/file-sync"),
    // For npm global installations with package name
    join(__dirname, "../webdav-backup/src/main/file-sync")
  ];
  
  let error;
  for (const path of possiblePaths) {
    try {
      console.log(`Trying to import from: ${path}`);
      const module = await import(path);
      console.log(`Successfully imported from: ${path}`);
      return module.syncFiles;
    } catch (err) {
      error = err;
      console.log(`Import failed from ${path}: ${err.message}`);
      
      // Special handling for the first failure to help diagnose the issue
      if (path === possiblePaths[0]) {
        try {
          console.log("Current directory:", process.cwd());
          console.log("Script directory:", __dirname);
          
          // Try to list the src directory if it exists
          const srcDir = join(__dirname, "src");
          if (existsSync(srcDir)) {
            console.log(`src directory exists at ${srcDir}`);
            const mainDir = join(srcDir, "main");
            if (existsSync(mainDir)) {
              console.log(`main directory exists at ${mainDir}`);
              const fileSyncPath = join(mainDir, "file-sync.ts");
              if (existsSync(fileSyncPath)) {
                console.log(`file-sync.ts exists at ${fileSyncPath}`);
              } else {
                console.log(`file-sync.ts does not exist at ${fileSyncPath}`);
              }
            } else {
              console.log(`main directory does not exist at ${mainDir}`);
            }
          } else {
            console.log(`src directory does not exist at ${srcDir}`);
          }
        } catch (diagError) {
          console.log(`Diagnostics error: ${diagError.message}`);
        }
      }
    }
  }
  
  // If we get here, all import attempts failed
  console.error(chalk.red(`Failed to import sync module: ${error.message}`));
  console.error(chalk.yellow("This is likely an installation or path resolution issue."));
  console.error(chalk.yellow("Please try reinstalling the package with: bun install -g webdav-backup"));
  return null;
}

// Parse command line arguments
function parse() {
  const { values, positionals } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      // Core options
      "cores": { type: "string" },
      "target": { type: "string" },
      "quiet": { type: "boolean" },
      "verbose": { type: "boolean" },
      "force": { type: "boolean" },
      "webdav-url": { type: "string" },
      
      // Help and version
      "help": { type: "boolean", short: "h" },
      "version": { type: "boolean", short: "v" }
    },
    allowPositionals: true
  });

  return {
    ...values,
    sourceDir: positionals[0]
  };
}

// Display help information
function showHelp() {  
  console.log(`
${chalk.bold(`Usage: webdav-backup <source-dir> [options]`)}

${chalk.bold("Options:")}
  --cores=<number>   Number of concurrent uploads (default: 2/3 of CPU cores)
  --target=<path>    Target directory on the WebDAV server (default: root directory)
  --quiet            Show minimal output (only errors and the progress bar)
  --verbose          Show detailed output including per-file operations
  --force            Force upload all files regardless of whether they've changed
  --webdav-url=<url> WebDAV server URL (required)
  --help, -h         Show this help message
  --version, -v      Show version information

${chalk.bold("Examples:")}
  webdav-backup /path/to/files --webdav-url=https://example.com/webdav
  webdav-backup /path/to/files --cores=4 --webdav-url=https://example.com/webdav
  webdav-backup /path/to/files --target=backup/daily --webdav-url=https://example.com/webdav
  webdav-backup /path/to/files --quiet --webdav-url=https://example.com/webdav
  webdav-backup /path/to/files --force --webdav-url=https://example.com/webdav
`);
}

// Show version information
function showVersion() {
  console.log(`webdav-backup v${VERSION}`);
}

// Main function
async function main() {
  try {
    // Check if help or version flags are present before parsing other arguments
    // This allows these flags to work without other required arguments
    const rawArgs = Bun.argv.slice(2);
    
    // Check for help flag first (highest priority)
    if (rawArgs.includes("--help") || rawArgs.includes("-h")) {
      showHelp();
      process.exit(0);
      return; // For TypeScript to understand the flow
    }
    
    // Check for version flag second (second priority)
    if (rawArgs.includes("--version") || rawArgs.includes("-v")) {
      showVersion();
      process.exit(0);
      return; // For TypeScript to understand the flow
    }
    
    // Show help when no arguments are provided
    if (rawArgs.length === 0) {
      showHelp();
      process.exit(0);
      return;
    }
    
    // Import the syncFiles function dynamically
    const syncFiles = await importSyncModule();
    if (!syncFiles) {
      process.exit(1);
    }
    
    // Parse CLI arguments for other commands
    const args = parse();
    
    // Check for required source directory
    if (!args.sourceDir) {
      console.error(chalk.red("Error: Source directory is required"));
      console.log(); // Add empty line for better readability
      showHelp();
      process.exit(1);
    }
    
    // Check for required webdav-url
    if (!args["webdav-url"]) {
      console.error(chalk.red("Error: --webdav-url is required"));
      console.log(); // Add empty line for better readability
      showHelp();
      process.exit(1);
    }
    
    // Run the main sync function with the parsed arguments
    await syncFiles(args.sourceDir, {
      cores: args.cores ? parseInt(args.cores) : undefined,
      target: args.target,
      quiet: args.quiet,
      verbose: args.verbose,
      force: args.force,
      webdavUrl: args["webdav-url"]
    });
    
  } catch (error) {
    console.error(chalk.red(`Error: ${error.message}`));
    console.log(); // Add empty line for better readability
    showHelp();
    process.exit(1);
  }
}

// Run the main function when this file is executed directly
if (import.meta.main) {
  main().catch(err => {
    console.error(chalk.red(`Error: ${err.message}`));
    console.log(); // Add empty line for better readability
    showHelp();
    process.exit(1);
  });
} 