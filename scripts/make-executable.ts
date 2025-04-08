#!/usr/bin/env bun

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

/**
 * Make bin.js executable
 * For cross-platform compatibility, we use a universal polyglot shebang
 * that works across all platforms and shells
 */

const rootDir = process.cwd();
const binPath = path.join(rootDir, 'bin.js');

// Universal polyglot shebang that works across shells and runtimes
const universalShebang = `#!/bin/sh
":" //# > /dev/null 2>&1; exec /usr/bin/env bun --bun "$0" "$@" || exec /usr/bin/env node "$0" "$@" || echo "Bun and Node.js are not installed. Please install one of them to run this script." >&2; exit 1 #`;

try {
  console.log(`Making executable: ${binPath}`);

  // Update shebang in bin.js if needed
  let content = fs.readFileSync(binPath, 'utf-8');
  if (!content.startsWith(universalShebang)) {
    content = `${universalShebang}\n${content.replace(/^#!.*\n/, '')}`;
    fs.writeFileSync(binPath, content);
    console.log('Updated with universal shebang');
  }

  // For Unix systems (macOS, Linux): Set executable permissions 
  // This does nothing on Windows but won't cause errors
  try {
    // Try using chmod directly
    fs.chmodSync(binPath, 0o755); // rwxr-xr-x
    console.log('Set executable permissions on bin.js');
  } catch (err) {
    console.log('Could not set permissions with fs.chmod, trying with execSync');
    
    // Fall back to exec on platforms where fs.chmod might not work as expected
    try {
      execSync(`chmod +x "${binPath}"`, { stdio: 'ignore' });
      console.log('Set executable permissions using chmod command');
    } catch (execErr) {
      // On Windows, this will fail but it's expected
      console.log('Could not run chmod command (expected on Windows)');
    }
  }
  
  console.log('Binary setup complete');
} catch (error) {
  console.error('Error setting up binary:', error);
  // Don't exit with error since this might be running on Windows
  // where chmod isn't available
} 