#!/usr/bin/env bun
/**
 * webdav-backup CLI
 * A simple, fast CLI for backing up files to WebDAV servers
 */

import { parseArgs } from "node:util";
import { basename, dirname, resolve, join } from "node:path";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import chalk from "chalk";
import { syncFiles } from "./src/main/file-sync";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJsonPath = resolve(__dirname, "./package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
const VERSION = packageJson.version;

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