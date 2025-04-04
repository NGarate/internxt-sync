#!/usr/bin/env bun

import fs from 'fs';
import path from 'path';

/**
 * Clean script for WebDAV backup tool
 * Removes the dist directory
 */

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');

try {
  if (fs.existsSync(distDir)) {
    console.log(`Removing directory: ${distDir}`);
    fs.rmSync(distDir, { recursive: true, force: true });
    console.log('Directory removed successfully');
  } else {
    console.log('No dist directory found. Nothing to clean.');
  }
} catch (error) {
  console.error('Error cleaning dist directory:', error);
  process.exit(1);
} 