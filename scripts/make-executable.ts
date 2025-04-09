#!/usr/bin/env bun

import { writeFileSync, chmodSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

/**
 * Make bin.js executable
 * For cross-platform compatibility, we use a universal polyglot shebang
 * that works across all platforms and shells
 */

// Create the bin directory if it doesn't exist
const binDir = join(process.cwd(), 'bin');
if (!existsSync(binDir)) {
  mkdirSync(binDir, { recursive: true });
}

// Create Bun wrapper
const bunWrapper = `#!/usr/bin/env bun

import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Set runtime flag
globalThis.isBunRuntime = true;

// Import and execute the Bun-specific version
const { default: app } = await import(pathToFileURL(join(__dirname, '../dist/bun/file-sync.js')).href);
app();
`;

// Create Node.js wrapper
const nodeWrapper = `#!/usr/bin/env node

import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Set runtime flag
globalThis.isBunRuntime = false;

// Import and execute the Node.js-specific version
const { default: app } = await import(pathToFileURL(join(__dirname, '../dist/node/file-sync.js')).href);
app();
`;

// Write and make executable both wrappers
writeFileSync(join(binDir, 'bun.js'), bunWrapper);
writeFileSync(join(binDir, 'node.js'), nodeWrapper);

// Make them executable
chmodSync(join(binDir, 'bun.js'), 0o755);
chmodSync(join(binDir, 'node.js'), 0o755);

// Create Windows wrappers
const windowsBunWrapper = `@echo off
bun "%~dp0\\..\\bin\\bun.js" %*
`;
const windowsNodeWrapper = `@echo off
node "%~dp0\\..\\bin\\node.js" %*
`;

// Bun's specialized .bunx file - extract content after the shebang to avoid duplication
const bunWrapperContent = bunWrapper.replace(/^#!.*\n/, ''); 
const bunxWrapper = `#!/usr/bin/env bun
${bunWrapperContent}`;

writeFileSync('webdav-backup.cmd', windowsBunWrapper);
writeFileSync('webdav-backup.ps1', `bun "${join(process.cwd(), 'bin', 'bun.js')}" $args`);
writeFileSync('webdav-backup.bunx', bunxWrapper);

console.log('Binary setup completed!'); 