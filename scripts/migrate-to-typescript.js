#!/usr/bin/env node

/**
 * Script to help migrate JavaScript files to TypeScript
 * This script will:
 * 1. Create TypeScript versions of JavaScript files
 * 2. Create interface definitions for common types
 * 3. Update imports to use TypeScript extensions
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

// Get the directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// ANSI color codes for better terminal output
const colors = {
  blue: '\x1b[34m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  reset: '\x1b[0m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}INFO: ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}SUCCESS: ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}WARNING: ${msg}${colors.reset}`),
  error: (msg) => console.error(`${colors.red}ERROR: ${msg}${colors.reset}`)
};

// Create an interfaces directory
const createInterfacesDir = () => {
  const interfacesDir = path.join(rootDir, 'src', 'interfaces');
  if (!fs.existsSync(interfacesDir)) {
    fs.mkdirSync(interfacesDir, { recursive: true });
    log.success(`Created interfaces directory at ${interfacesDir}`);
  }
  return interfacesDir;
};

// Create basic interfaces
const createBasicInterfaces = (interfacesDir) => {
  // WebDAV interfaces
  const webdavInterfacePath = path.join(interfacesDir, 'webdav.ts');
  if (!fs.existsSync(webdavInterfacePath)) {
    const webdavInterface = `/**
 * WebDAV related interfaces
 */

export interface WebDAVConnectivityOptions {
  url: string;
  verbosity?: number;
}

export interface WebDAVServiceOptions {
  url: string;
  verbosity?: number;
}

export interface WebDAVClientOptions {
  url: string;
  username?: string;
  password?: string;
}

export interface UploadResult {
  success: boolean;
  filePath: string;
  output?: string;
}

export interface DirectoryResult {
  success: boolean;
  path: string;
  output?: string;
}
`;
    fs.writeFileSync(webdavInterfacePath, webdavInterface);
    log.success(`Created WebDAV interfaces at ${webdavInterfacePath}`);
  }

  // Logger interfaces
  const loggerInterfacePath = path.join(interfacesDir, 'logger.ts');
  if (!fs.existsSync(loggerInterfacePath)) {
    const loggerInterface = `/**
 * Logger related interfaces
 */

export enum Verbosity {
  Silent = 0,
  Minimal = 1,
  Normal = 2,
  Verbose = 3,
  Debug = 4
}
`;
    fs.writeFileSync(loggerInterfacePath, loggerInterface);
    log.success(`Created Logger interfaces at ${loggerInterfacePath}`);
  }

  // File scanner interfaces
  const fileScannerInterfacePath = path.join(interfacesDir, 'file-scanner.ts');
  if (!fs.existsSync(fileScannerInterfacePath)) {
    const fileScannerInterface = `/**
 * File scanner related interfaces
 */

export interface FileInfo {
  relativePath: string;
  absolutePath: string;
  size: number;
  checksum: string;
  hasChanged: boolean | null;
}

export interface ScanResult {
  allFiles: FileInfo[];
  filesToUpload: FileInfo[];
  totalSizeBytes: number;
  totalSizeMB: string;
}

export interface UploadState {
  files: Record<string, string>;
  lastRun: string;
}
`;
    fs.writeFileSync(fileScannerInterfacePath, fileScannerInterface);
    log.success(`Created File Scanner interfaces at ${fileScannerInterfacePath}`);
  }
};

// Convert a JavaScript file to TypeScript
const convertJsToTs = (filePath) => {
  if (!filePath.endsWith('.js')) {
    log.warning(`Skipping non-JS file: ${filePath}`);
    return;
  }

  const tsFilePath = filePath.replace('.js', '.ts');
  
  // Check if TS file already exists
  if (fs.existsSync(tsFilePath)) {
    log.warning(`TypeScript file already exists: ${tsFilePath}`);
    return;
  }

  // Read JS file
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Update imports to use .js extensions (required for ESM)
  content = content.replace(/from ['"](.+?)(?:\.js)?['"]/g, (match, importPath) => {
    // Don't add .js extension to package imports
    if (importPath.startsWith('.') || importPath.startsWith('/')) {
      return `from '${importPath}.js'`;
    }
    return match;
  });

  // Add appropriate interface imports based on the file content
  if (content.includes('WebDAV')) {
    content = `import { WebDAVConnectivityOptions, WebDAVServiceOptions, WebDAVClientOptions, UploadResult, DirectoryResult } from '../interfaces/webdav.js';\n${content}`;
  }
  
  if (content.includes('Verbosity') || content.includes('logger.')) {
    content = `import { Verbosity } from '../interfaces/logger.js';\n${content}`;
  }
  
  if (content.includes('FileScanner') || content.includes('file-scanner')) {
    content = `import { FileInfo, ScanResult, UploadState } from '../interfaces/file-scanner.js';\n${content}`;
  }

  // Write TS file
  fs.writeFileSync(tsFilePath, content);
  log.success(`Converted ${filePath} to TypeScript`);

  return tsFilePath;
};

// Process all files in a directory recursively
const processDirectory = (dir) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    // Skip node_modules and hidden directories
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.') || entry.name === 'dist') {
        continue;
      }
      processDirectory(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      convertJsToTs(fullPath);
    }
  }
};

// Main function
const main = () => {
  try {
    log.info('Starting TypeScript migration...');
    
    // Create interfaces directory and basic interfaces
    const interfacesDir = createInterfacesDir();
    createBasicInterfaces(interfacesDir);
    
    // Process source directories
    log.info('Processing source directories...');
    processDirectory(path.join(rootDir, 'src'));
    
    // Install TypeScript dependencies if not already installed
    log.info('Checking TypeScript dependencies...');
    try {
      execSync('npm list typescript @types/node', { stdio: 'ignore' });
    } catch (error) {
      log.info('Installing TypeScript dependencies...');
      execSync('npm install --save-dev typescript @types/node', { stdio: 'inherit' });
    }
    
    log.success('TypeScript migration completed!');
    log.info('Next steps:');
    log.info('1. Review and fix any type errors in the generated TypeScript files');
    log.info('2. Run "npm run build" to compile the TypeScript files');
    log.info('3. Run "npm test" to ensure everything works correctly');
    
  } catch (error) {
    log.error(`Migration failed: ${error.message}`);
    process.exit(1);
  }
};

main(); 