#!/usr/bin/env bun

/**
 * Build script for Internxt WebDAV Uploader
 * Handles building the application with Bun
 */

import path from 'path';
import { existsSync, mkdirSync } from 'fs';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

// Get the directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

// ANSI color codes for terminal output
const colors = {
  blue: '\x1b[34m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  reset: '\x1b[0m'
};

// Create dist directory if it doesn't exist
if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true });
}

console.log(`${colors.blue}Building Internxt WebDAV Uploader with Bun...${colors.reset}`);

// Run the Bun build command for internxt-sync.ts and index.ts
function runBuildCommand(entry: string, outname?: string) {
  console.log(`${colors.blue}Building ${entry}...${colors.reset}`);
  
  // Use args array for better readability and maintenance
  let args = [
    'build', 
    entry, 
    '--outdir', 'dist', 
    '--target', 'node',
    '--format', 'esm',
    '--external', 'chalk,webdav'
  ];
  
  if (outname) {
    args.push('--outfile', outname);
  }
  
  const result = spawnSync('bun', args, {
    cwd: rootDir,
    stdio: 'inherit',
    shell: true
  });
  
  if (result.status !== 0) {
    console.error(`${colors.red}Failed to build ${entry}.${colors.reset}`);
    process.exit(1);
  }
  
  console.log(`${colors.green}Successfully built ${entry}${colors.reset}`);
}

// Build main entry points
runBuildCommand('internxt-sync.ts');
runBuildCommand('index.ts');

// Add shebang to make executable
if (existsSync(path.join(distDir, 'index.js'))) {
  console.log(`${colors.blue}Adding shebang to index.js...${colors.reset}`);
  
  // Read the file
  const indexJsPath = path.join(distDir, 'index.js');
  let content = '';
  
  try {
    content = Bun.file(indexJsPath).text();
    
    // Only add shebang if it doesn't already exist
    if (!content.startsWith('#!/usr/bin/env node')) {
      content = '#!/usr/bin/env node\n' + content;
      Bun.write(indexJsPath, content);
      console.log(`${colors.green}Added shebang to index.js${colors.reset}`);
    }
  } catch (err) {
    console.error(`${colors.red}Error modifying index.js: ${err}${colors.reset}`);
  }
  
  // Make the index.js file executable (skip on Windows)
  if (process.platform !== 'win32') {
    console.log(`${colors.blue}Making index.js executable...${colors.reset}`);
    
    const chmodResult = spawnSync('chmod', ['+x', indexJsPath], {
      cwd: rootDir,
      stdio: 'inherit',
      shell: true
    });
    
    if (chmodResult.status === 0) {
      console.log(`${colors.green}Made index.js executable${colors.reset}`);
    } else {
      console.error(`${colors.red}Failed to make index.js executable${colors.reset}`);
    }
  }
}

console.log(`${colors.green}Build completed successfully!${colors.reset}`); 