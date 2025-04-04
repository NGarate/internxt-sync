#!/usr/bin/env bun

/**
 * Script to find potentially unused files in the project
 * This searches all import statements to see which files are actually referenced
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const srcDir = path.join(rootDir, 'src');

// ANSI color codes for terminal output
const colors = {
  blue: '\x1b[34m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  reset: '\x1b[0m'
};

// Directories and files to exclude from analysis
const excludeDirs = [
  'node_modules',
  'dist',
  '.git',
  '.github',
  'scripts',
  'src/test'
];

const excludeFiles = [
  '.gitignore',
  'package.json',
  'package-lock.json',
  'yarn.lock',
  'README.md',
  'LICENSE',
  'tsconfig.json',
  'tsconfig.build.json',
  'tsconfig.test.json',
];

// Entry point files that should always be kept
const entryPoints = [
  'src/main/file-sync.ts',
  'index.ts',
  'bin.js'
];

// Regular expression to match import statements
const importRegex = /import\s+.*?from\s+['"](.+?)['"]/g;
const importRegexRelative = /import\s+.*?from\s+['"](\..+?)['"]/g;
const dynamicImportRegex = /import\(['"](.+?)['"]\)/g;

/**
 * Find all files in a directory recursively
 */
function findFiles(dir, fileList = [], root = dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const relativePath = path.relative(root, filePath);
    const stat = fs.statSync(filePath);
    
    // Skip excluded directories and files
    const isExcludedDir = excludeDirs.some(excluded => 
      relativePath.startsWith(excluded) || 
      relativePath.includes('/' + excluded + '/')
    );
    
    if (isExcludedDir) continue;
    
    if (stat.isDirectory()) {
      findFiles(filePath, fileList, root);
    } else {
      const isExcludedFile = excludeFiles.some(excluded => 
        file === excluded || 
        file.endsWith('.' + excluded)
      );
      
      // Skip excluded files and non-TS/JS files
      if (!isExcludedFile && (file.endsWith('.ts') || file.endsWith('.js'))) {
        fileList.push({
          path: filePath,
          relativePath: relativePath,
          content: fs.readFileSync(filePath, 'utf8')
        });
      }
    }
  }
  
  return fileList;
}

/**
 * Find all import statements in a file
 */
function findImports(fileContent) {
  const imports = new Set();
  
  // Match regular imports: import X from './path'
  let match;
  while ((match = importRegexRelative.exec(fileContent)) !== null) {
    imports.add(match[1]);
  }
  
  // Match dynamic imports: import('./path')
  while ((match = dynamicImportRegex.exec(fileContent)) !== null) {
    imports.add(match[1]);
  }
  
  return [...imports];
}

/**
 * Resolve an import path to an absolute file path
 */
function resolveImportPath(importPath, currentFilePath) {
  const currentDir = path.dirname(currentFilePath);
  let resolvedPath = path.resolve(currentDir, importPath);
  
  // Handle directory imports
  if (!importPath.endsWith('.js') && !importPath.endsWith('.ts')) {
    // Try with .ts extension
    if (fs.existsSync(resolvedPath + '.ts')) {
      resolvedPath += '.ts';
    } 
    // Try with .js extension
    else if (fs.existsSync(resolvedPath + '.js')) {
      resolvedPath += '.js';
    }
    // Try as directory with index.ts
    else if (fs.existsSync(path.join(resolvedPath, 'index.ts'))) {
      resolvedPath = path.join(resolvedPath, 'index.ts');
    }
    // Try as directory with index.js
    else if (fs.existsSync(path.join(resolvedPath, 'index.js'))) {
      resolvedPath = path.join(resolvedPath, 'index.js');
    }
  }
  
  return resolvedPath;
}

// Main function
async function main() {
  console.log(`${colors.blue}Finding all source files...${colors.reset}`);
  const allFiles = findFiles(rootDir);
  console.log(`${colors.green}Found ${allFiles.length} source files.${colors.reset}`);
  
  // Map of file paths to files
  const fileMap = new Map();
  for (const file of allFiles) {
    fileMap.set(file.path, file);
  }
  
  // Track imports
  const importGraph = new Map();
  const referencedFiles = new Set();
  
  // Add entry points to referenced files
  for (const entryPoint of entryPoints) {
    const entryFile = allFiles.find(file => file.relativePath === entryPoint);
    if (entryFile) {
      referencedFiles.add(entryFile.path);
    }
  }
  
  // Build import graph
  for (const file of allFiles) {
    const imports = findImports(file.content);
    importGraph.set(file.path, []);
    
    for (const importPath of imports) {
      const resolvedPath = resolveImportPath(importPath, file.path);
      if (fileMap.has(resolvedPath)) {
        importGraph.get(file.path).push(resolvedPath);
        referencedFiles.add(resolvedPath);
      }
    }
  }
  
  // Find unreferenced files
  const unreferencedFiles = allFiles.filter(file => 
    !referencedFiles.has(file.path) && 
    !entryPoints.includes(file.relativePath)
  );
  
  if (unreferencedFiles.length === 0) {
    console.log(`${colors.green}No unused files found!${colors.reset}`);
  } else {
    console.log(`${colors.yellow}Found ${unreferencedFiles.length} potentially unused files:${colors.reset}`);
    for (const file of unreferencedFiles) {
      console.log(`${colors.yellow}${file.relativePath}${colors.reset}`);
    }
  }
}

// Run the main function
main().catch(error => {
  console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
  process.exit(1);
}); 