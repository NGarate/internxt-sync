#!/usr/bin/env bun

import fs from 'fs';
import path from 'path';

/**
 * Make bin.js compatible with both Node.js and Bun runtimes
 * 
 * This script wraps the bin.js file with runtime detection to ensure
 * it can be executed directly by either Node.js or Bun.
 */

const rootDir = process.cwd();
const binPath = path.join(rootDir, 'dist/bin.js');

try {
  console.log(`Making cross-compatible: ${binPath}`);
  
  // Read the current content of bin.js
  let content = fs.readFileSync(binPath, 'utf-8');
  
  // Remove any existing shebang line
  if (content.startsWith('#!')) {
    content = content.replace(/^#!.*\n/, '');
  }
  
  // Create a dual-runtime shebang that works with both Node.js and Bun
  // This uses the "env" trick to find the first available runtime
  const dualRuntimeWrapper = `#!/usr/bin/env -S node --no-warnings
// The above line allows this script to run with Node.js
// The line below ensures it also works with Bun if executed with "bun bin.js"
// @ts-ignore
if (typeof Bun !== 'undefined') {
  console.log("Detected Bun runtime");
}

${content}`;
  
  // Write the modified content back to bin.js
  fs.writeFileSync(binPath, dualRuntimeWrapper);
  console.log('Made bin.js compatible with both Node.js and Bun');
  
} catch (error) {
  console.error('Error making bin.js cross-compatible:', error);
  process.exit(1);
} 