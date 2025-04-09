#!/usr/bin/env node

import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Set runtime flag
globalThis.isBunRuntime = false;

// Import and execute the Node.js-specific version
const { default: app } = await import(pathToFileURL(join(__dirname, '../dist/node/file-sync.js')).href);
app();
