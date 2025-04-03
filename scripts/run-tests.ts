#!/usr/bin/env bun

/**
 * Test runner script
 * This script makes it easier to run different subsets of tests
 */

import { spawnSync } from 'child_process';
import { readdirSync } from 'fs';
import { join } from 'path';
import { 
  WORKING_TEST_FILES, 
  REQUIRES_MOCKS,
  SPECIALIZED_TESTS
} from '../src/test/test-helpers/test-only';

// Get command line arguments (test files to run)
const args = process.argv.slice(2);

// Define test modes
const TEST_MODES = {
  working: 'working',
  all: 'all',
  specific: 'specific',
  mocked: 'mocked'
};

// Get the test mode from the first argument or default to 'working'
const mode = args.length > 0 && Object.values(TEST_MODES).includes(args[0] as any) 
  ? args.shift() as string 
  : TEST_MODES.working;

// Build test pattern based on mode
let testPattern: string[];
if (mode === TEST_MODES.working) {
  // Run only tests known to be working
  testPattern = WORKING_TEST_FILES;
} else if (mode === TEST_MODES.all) {
  // Try to run all tests
  try {
    testPattern = readdirSync('./src/test', { withFileTypes: true })
      .filter(dirent => dirent.isFile() && dirent.name.endsWith('.test.ts'))
      .map(dirent => join('./src/test', dirent.name));
  } catch (error) {
    console.error('Error reading test files:', error);
    testPattern = WORKING_TEST_FILES;
  }
} else if (mode === TEST_MODES.mocked) {
  // Run tests that require mocking
  testPattern = [...WORKING_TEST_FILES, ...REQUIRES_MOCKS];
} else {
  // For specific mode or any other mode, use the remaining arguments
  testPattern = args.length > 0 ? args : WORKING_TEST_FILES;
}

// Build the command arguments
const commandArgs = [
  'test',
  '--tsconfig-override',
  'tsconfig.test.json',
  '--preload',
  './src/test/test-helpers/setup.ts',
  ...testPattern
];

console.log(`Running tests with command: bun ${commandArgs.join(' ')}`);

// Execute the test command
const result = spawnSync('bun', commandArgs, { 
  stdio: 'inherit',
  shell: true
});

// Exit with the same code as the test command
process.exit(result.status || 0); 