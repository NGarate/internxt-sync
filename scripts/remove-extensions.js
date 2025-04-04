#!/usr/bin/env node

/**
 * This script removes file extensions from import statements in TypeScript files
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

// File extensions to process
const extensions = ['.ts', '.tsx'];

// Regex to match imports with extensions
const importRegex = /from\s+['"]([^'"]+\.(js|ts))['"]|import\s+['"]([^'"]+\.(js|ts))['"]/g;

// Keep track of processed files
const processed = new Set();

// Process a file to remove extensions from imports
function processFile(filePath) {
  if (processed.has(filePath)) return;
  processed.add(filePath);

  try {
    // Read file content
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Replace imports with extensions
    const newContent = content.replace(importRegex, (match, p1, p2, p3, p4) => {
      const importPath = p1 || p3;
      const ext = p2 || p4;
      
      // Remove the extension
      const pathWithoutExt = importPath.replace(`.${ext}`, '');
      
      // Create the new import statement
      return match.replace(importPath, pathWithoutExt);
    });
    
    // Only write if content changed
    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`Updated: ${path.relative(rootDir, filePath)}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
}

// Walk directory recursively
function processDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    // Skip node_modules and dist
    if (entry.name === 'node_modules' || entry.name === 'dist') continue;
    
    if (entry.isDirectory()) {
      processDirectory(fullPath);
    } else if (entry.isFile() && extensions.includes(path.extname(entry.name))) {
      processFile(fullPath);
    }
  }
}

// Start processing from src directory
console.log('Removing file extensions from imports...');
processDirectory(path.join(rootDir, 'src'));
console.log('Done!'); 