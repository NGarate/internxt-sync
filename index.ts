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

// Dynamically import the file-sync module with proper path resolution
let syncFiles;
try {
  // First try to import from the expected location
  syncFiles = (await import("./src/main/file-sync.js")).default;
} catch (error) {
  try {
    // Try importing with .ts extension
    syncFiles = (await import("./src/main/file-sync.ts")).default;
  } catch (error) {
    console.error(chalk.red("Error: Could not find the file-sync module."));
    console.error(chalk.yellow("This might be due to a global installation issue."));
    process.exit(1);
  }
}

// Read version from package.json, with fallback
let VERSION = "0.0.0";
try {
  const packageJsonPath = resolve(__dirname, "./package.json");
  if (existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
    VERSION = packageJson.version;
  } else {
    console.warn(chalk.yellow("Warning: Could not find package.json for version info."));
  }
} catch (error) {
  console.warn(chalk.yellow("Warning: Could not read version from package.json."));
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
  const runtime = typeof Bun !== 'undefined' ? 'bun' : 'node';
  
  console.log(`
${chalk.bold(`Usage: ${runtime} webdav-backup <source-dir> [options]`)}

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
    // Parse CLI arguments
    const args = parse();
    
    // Show version info if requested
    if (args.version) {
      showVersion();
      process.exit(0);
    }
    
    // Show help if requested
    if (args.help) {
      showHelp();
      process.exit(0);
    }
    
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