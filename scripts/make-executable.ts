#!/usr/bin/env bun

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

/**
 * Make bin.js executable
 * This script is needed for Unix-like systems where the file needs executable permissions
 */

const rootDir = process.cwd();
const binPath = path.join(rootDir, 'dist/bin.js');

try {
  console.log(`Making executable: ${binPath}`);
  
  // Add shebang line to the top of bin.js if it doesn't exist
  let content = fs.readFileSync(binPath, 'utf-8');
  if (!content.startsWith('#!/usr/bin/env')) {
    content = '#!/usr/bin/env node\n' + content;
    fs.writeFileSync(binPath, content);
    console.log('Added shebang line to bin.js');
  }

  // Make the file executable (chmod +x) on Unix-like systems
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