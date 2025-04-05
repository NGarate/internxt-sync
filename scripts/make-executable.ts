#!/usr/bin/env bun

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

/**
 * Make bin.js executable
 * For cross-platform compatibility, we don't use a shebang in the main bin.js file
 * but we still need to make it executable on Unix-like systems and create appropriate
 * Windows helpers for package manager installations.
 */

const rootDir = process.cwd();
const binPath = path.join(rootDir, 'bin.js');
const pkgName = 'webdav-backup'; // Package name for executables

try {
  console.log(`Making executable: ${binPath}`);
  
  // The bin.js file shouldn't have a shebang to ensure Windows compatibility
  // But we need to make sure it's executable on Unix-like systems

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
  
  // Create Windows helper files for package manager installations
  if (process.platform === 'win32' || process.env.CREATE_WINDOWS_HELPERS) {
    // Create the bin directory if it doesn't exist
    const binDir = path.join(rootDir, 'bin');
    if (!fs.existsSync(binDir)) {
      fs.mkdirSync(binDir);
      console.log('Created bin directory');
    }

    // 1. Create CMD wrapper (for Command Prompt)
    const cmdPath = path.join(rootDir, `${pkgName}.cmd`);
    const cmdContent = '@echo off\r\nnode "%~dp0\\bin.js" %*';
    fs.writeFileSync(cmdPath, cmdContent);
    console.log('Created Windows .cmd wrapper');

    // 2. Create PS1 wrapper (for PowerShell)
    const ps1Path = path.join(rootDir, `${pkgName}.ps1`);
    const ps1Content = `#!/usr/bin/env pwsh
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Definition
& node "$scriptPath\\bin.js" @args`;
    fs.writeFileSync(ps1Path, ps1Content);
    console.log('Created Windows .ps1 wrapper');

    // 3. Create executable wrappers directory for package manager bin links
    // When installed globally, package managers put executables in different locations
    const winBinPath = path.join(binDir, `${pkgName}.js`);
    const winBinContent = `#!/usr/bin/env node
require('../bin.js');`;
    fs.writeFileSync(winBinPath, winBinContent);
    console.log('Created Windows bin/wrapper.js');

    // 4. Create .cmd file in bin directory for npm
    const binCmdPath = path.join(binDir, `${pkgName}.cmd`);
    const binCmdContent = '@echo off\r\nnode "%~dp0\\..\\bin.js" %*';
    fs.writeFileSync(binCmdPath, binCmdContent);
    console.log('Created bin/.cmd wrapper');
  }
  
  console.log('Binary setup complete');
} catch (error) {
  console.error('Error setting up binary:', error);
  // Don't exit with error since this might be running on Windows
  // where chmod isn't available
} 