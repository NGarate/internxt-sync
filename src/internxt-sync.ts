#!/usr/bin/env bun
import { FileInfo, ScanResult, UploadState } from '../interfaces/file-scanner.js';
import { Verbosity } from '../interfaces/logger.js';
import { WebDAVConnectivityOptions, WebDAVServiceOptions, WebDAVClientOptions, UploadResult, DirectoryResult } from '../interfaces/webdav.js';
import { createRequire } from "node:module";
var __require = /* @__PURE__ */ createRequire(import.meta.url);

// internxt-sync.ts
import chalk4 from "chalk";
import path4 from "path";
import { fileURLToPath } from "url";

// src/utils/env-utils.js
import os from "os";
import { exec } from "child_process";
import { promisify } from "util";
var execAsync = promisify(exec);
function isBunEnvironment() {
  return typeof process !== "undefined" && typeof process.versions !== "undefined" && typeof process.versions.bun !== "undefined";
}
function getOptimalConcurrency(userSpecified) {
  if (userSpecified && !isNaN(userSpecified) && userSpecified > 0) {
    return userSpecified;
  }
  const totalCores = os.cpus().length;
  return Math.max(1, Math.floor(totalCores * (2 / 3)));
}

// src/utils/logger.js
import chalk from "chalk";
var Verbosity = {
  Quiet: 0,
  Normal: 1,
  Verbose: 2
};
var recentMessages = new Set;
var MAX_RECENT_MESSAGES = 10;
var DUPLICATE_TIMEOUT = 1000;
// List of emoji characters that might need spacing
var emojis = ['✅', '❌', '⚠️', 'ℹ️', '🔄', '📁', '📂', '📄', '🚀', '📊', '⬆️', '⬇️'];

// Ensure emoji spacing
function ensureEmojiSpacing(message) {
  if (typeof message !== 'string') return message;
  
  let result = message;
  for (const emoji of emojis) {
    if (result.includes(emoji)) {
      result = result.replace(new RegExp(`${emoji}(?!\\s)`, 'g'), `${emoji} `);
    }
  }
  return result;
}

// Patch console methods for consistent emoji spacing
function patchConsole() {
  const originalLog = console.log;
  const originalInfo = console.info;
  const originalWarn = console.warn;
  const originalError = console.error;
  
  console.log = function(...args) {
    const formattedArgs = args.map(arg => 
      typeof arg === 'string' ? ensureEmojiSpacing(arg) : arg
    );
    return originalLog.apply(console, formattedArgs);
  };
  
  console.info = function(...args) {
    const formattedArgs = args.map(arg => 
      typeof arg === 'string' ? ensureEmojiSpacing(arg) : arg
    );
    return originalInfo.apply(console, formattedArgs);
  };
  
  console.warn = function(...args) {
    const formattedArgs = args.map(arg => 
      typeof arg === 'string' ? ensureEmojiSpacing(arg) : arg
    );
    return originalWarn.apply(console, formattedArgs);
  };
  
  console.error = function(...args) {
    const formattedArgs = args.map(arg => 
      typeof arg === 'string' ? ensureEmojiSpacing(arg) : arg
    );
    return originalError.apply(console, formattedArgs);
  };
}

function clearOldMessages() {
  if (recentMessages.size > MAX_RECENT_MESSAGES) {
    recentMessages.clear();
  }
  setTimeout(() => {
    recentMessages.clear();
  }, DUPLICATE_TIMEOUT);
}
function log(message, level, currentVerbosity, allowDuplicates = true) {
  if (currentVerbosity >= level) {
    if (!allowDuplicates && recentMessages.has(message)) {
      return;
    }
    console.log(message);
    if (!allowDuplicates) {
      recentMessages.add(message);
      clearOldMessages();
    }
  }
}
function error(message) {
  console.error(chalk.red(message));
}
function warning(message, currentVerbosity) {
  log(chalk.yellow(message), Verbosity.Normal, currentVerbosity, false);
}
function info(message, currentVerbosity) {
  log(chalk.blue(message), Verbosity.Normal, currentVerbosity, false);
}
function success(message, currentVerbosity) {
  log(chalk.green(message), Verbosity.Normal, currentVerbosity, true);
}
function verbose(message, currentVerbosity) {
  log(message, Verbosity.Verbose, currentVerbosity, true);
}
function always(message) {
  console.log(message);
}

// src/utils/input-utils.js
import readline from "readline";
import { promisify as promisify2 } from "util";
import { exec as exec2 } from "child_process";
import { createInterface } from "readline";
import { Writable } from "stream";
import { spawnSync } from "child_process";
var execAsync2 = promisify2(exec2);
function createReadlineInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}
async function promptUser2(question) {
  const rl = createReadlineInterface();
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}
async function promptPassword(question) {
  return getSecurePassword(question);
}
function parseArguments(args) {
  const options = {
    sourceDir: null,
    verbosity: 1,
    cores: undefined,
    targetDir: "",
    skipSetup: false,
    webdavUrl: undefined,
    showHelp: false
  };
  if (args.length < 1 || args.includes("--help")) {
    options.showHelp = true;
    if (args.length >= 1 && !args.includes("--help")) {
      options.sourceDir = args[0];
    }
    return options;
  }
  options.sourceDir = args[0];
  if (args.includes("--quiet")) {
    options.verbosity = 0;
  } else if (args.includes("--verbose")) {
    options.verbosity = 2;
  }
  if (args.includes("--skip-setup")) {
    options.skipSetup = true;
  }
  for (const arg of args) {
    if (arg.startsWith("--cores=")) {
      const coreValue = parseInt(arg.split("=")[1], 10);
      if (!isNaN(coreValue) && coreValue > 0) {
        options.cores = coreValue;
      }
    } else if (arg.startsWith("--target=")) {
      options.targetDir = arg.substring("--target=".length);
    } else if (arg.startsWith("--webdav-url=")) {
      options.webdavUrl = arg.substring("--webdav-url=".length);
    }
  }
  return options;
}
async function getSecurePassword(prompt) {
  if (process.platform === "win32") {
    return getSecurePasswordWindows(prompt);
  }
  try {
    process.stdout.write(`${prompt}: `);
    spawnSync("stty", ["-echo"], { stdio: "inherit" });
    const rl = createReadlineInterface();
    const password = await new Promise((resolve) => {
      rl.question("", (answer) => {
        resolve(answer);
        rl.close();
      });
    });
    spawnSync("stty", ["echo"], { stdio: "inherit" });
    console.log();
    return password;
  } catch (error2) {
    try {
      spawnSync("stty", ["echo"], { stdio: "inherit" });
    } catch (e) {
    }
    console.warn("Warning: Secure password input not available. Your password may be visible.");
    return promptUser2(`${prompt} (warning: may be visible): `);
  }
}
async function getSecurePasswordWindows(prompt) {
  try {
    const mutableStdout = new Writable({
      write: function(chunk, encoding, callback) {
        if (!this.muted) {
          process.stdout.write(chunk, encoding);
        }
        callback();
      }
    });
    mutableStdout.muted = false;
    const rl = createInterface({
      input: process.stdin,
      output: mutableStdout,
      terminal: true
    });
    process.stdout.write(`${prompt}: `);
    await new Promise((resolve) => setTimeout(resolve, 100));
    mutableStdout.muted = true;
    const password = await new Promise((resolve, reject) => {
      let hasResolved = false;
      const cleanup = () => {
        if (!rl.closed) {
          rl.close();
        }
      };
      rl.question("", (answer) => {
        if (hasResolved)
          return;
        hasResolved = true;
        process.stdout.write(`
`);
        cleanup();
        resolve(answer);
      });
      rl.on("error", (error2) => {
        if (hasResolved)
          return;
        hasResolved = true;
        process.stdout.write(`
`);
        cleanup();
        reject(error2);
      });
      rl.on("SIGINT", () => {
        if (hasResolved)
          return;
        hasResolved = true;
        process.stdout.write(`
`);
        cleanup();
        reject(new Error("Password input canceled"));
      });
      setTimeout(() => {
        if (hasResolved)
          return;
        hasResolved = true;
        process.stdout.write(`
`);
        cleanup();
        resolve("");
      }, 15000);
    });
    return password;
  } catch (error2) {
    console.warn("Warning: Secure password input not available. Your password may be visible.");
    return promptUser2(`${prompt} (warning: may be visible): `);
  }
}

// src/utils/help-text.js
function showHelp() {
  const scriptExt = isBunEnvironment() ? ".ts" : ".js";
  const runtime = isBunEnvironment() ? "bun" : "node";
  always(`
Usage: ${runtime} internxt-sync${scriptExt} <source-dir> [options]

Options:
  --cores=<number>   Number of concurrent uploads (default: 2/3 of CPU cores)
  --target=<path>    Target directory on Internxt (default: root directory)
  --quiet            Show minimal output (only errors and the progress bar)
  --verbose          Show detailed output including per-file operations
  --skip-setup       Skip the full setup process (still checks WebDAV status)
  --webdav-url=<url> Use a specific WebDAV URL (optional, can be auto-detected)
  --help             Show this help message

Examples:
  ${runtime} internxt-sync${scriptExt} /path/to/files
  ${runtime} internxt-sync${scriptExt} /path/to/files --cores=4
  ${runtime} internxt-sync${scriptExt} /path/to/files --target=backup/daily
  ${runtime} internxt-sync${scriptExt} /path/to/files --quiet
  ${runtime} internxt-sync${scriptExt} /path/to/files --skip-setup
  ${runtime} internxt-sync${scriptExt} /path/to/files --skip-setup --webdav-url=http://webdav.local.internxt.com:3005
  `);
}

// src/utils/command-runner.js
import { exec as exec3, spawn } from "child_process";
import { promisify as promisify3 } from "util";
var execAsync3 = promisify3(exec3);
async function runCommand2(command, options = {}, verbosity = Verbosity.Normal) {
  try {
    if (verbosity > Verbosity.Quiet) {
      verbose(`Running command: ${command}`, verbosity);
    }
    if (options.input) {
      const parts = command.split(/\s+/);
      const cmd = parts[0];
      const args = parts.slice(1);
      return new Promise((resolve, reject) => {
        const child = spawn(cmd, args, {
          ...options,
          stdio: ["pipe", "pipe", "pipe"]
        });
        let stdout = "";
        let stderr = "";
        child.stdout.on("data", (data) => {
          stdout += data.toString();
        });
        child.stderr.on("data", (data) => {
          stderr += data.toString();
        });
        child.on("error", (error2) => {
          reject(error2);
        });
        child.on("close", (code) => {
          if (code === 0) {
            resolve({ stdout, stderr });
          } else {
            const error2 = new Error(`Command failed with exit code ${code}`);
            error2.code = code;
            error2.stdout = stdout;
            error2.stderr = stderr;
            reject(error2);
          }
        });
        child.stdin.write(options.input);
        child.stdin.end();
      });
    } else {
      const result = await execAsync3(command, options);
      return result;
    }
  } catch (error2) {
    if (verbosity > Verbosity.Quiet) {
      verbose(`Command failed: ${command}`, verbosity);
    }
    throw error2;
  }
}
async function runCommandWithFallback(primaryCommand, fallbackCommand, options = {}, verbosity = Verbosity.Normal) {
  try {
    if (verbosity > Verbosity.Quiet) {
      verbose(`Trying primary command: ${primaryCommand}`, verbosity);
    }
    return await runCommand2(primaryCommand, options, verbosity);
  } catch (primaryError) {
    if (verbosity > Verbosity.Quiet) {
      verbose(`Trying fallback command`, verbosity);
    }
    try {
      return await runCommand2(fallbackCommand, options, verbosity);
    } catch (fallbackError) {
      if (verbosity > Verbosity.Quiet) {
        verbose(`All commands failed`, verbosity);
      }
      return null;
    }
  }
}
function createInteractiveProcess(command, args, options = {}, verbosity = Verbosity.Normal) {
  try {
    if (verbosity > Verbosity.Quiet) {
      verbose(`Starting process: ${command}`, verbosity);
    }
    return spawn(command, args, { stdio: ["pipe", "pipe", "pipe"], ...options });
  } catch (error2) {
    if (verbosity > Verbosity.Quiet) {
      verbose(`Failed to start process`, verbosity);
    }
    throw error2;
  }
}

// src/core/cli-commands.js
import chalk2 from "chalk";
import * as fs from "fs";
import * as path from "path";
import * as os2 from "os";
import { randomBytes } from "crypto";
async function checkInternxtInstalled(verbosity) {
  info("Checking if Internxt CLI is installed...", verbosity);
  try {
    const result = await runCommandWithFallback("internxt --version", "npx @internxt/cli --version", {}, verbosity);
    if (result) {
      const version = result.stdout.trim();
      success(`Internxt CLI is installed (version: ${version})`, verbosity);
      return { installed: true, version };
    }
  } catch (error2) {
    warning("Internxt CLI is not installed yet.", verbosity);
  }
  return { installed: false, version: null };
}
async function installInternxtCLI(verbosity) {
  info("Installing Internxt CLI globally...", verbosity);
  try {
    if (isBunEnvironment()) {
      try {
        info("Trying installation with Bun...", verbosity);
        await runCommand2("bun install -g @internxt/cli", {}, verbosity);
        success("Internxt CLI installed successfully with Bun! You can now use the 'internxt' command.", verbosity);
        return true;
      } catch (bunError) {
        warning(`Bun installation failed: ${bunError}`, verbosity);
      }
    }
    info("Trying installation with npm...", verbosity);
    await runCommand2("npm install -g @internxt/cli", {}, verbosity);
    success("Internxt CLI installed successfully with npm! You can now use the 'internxt' command.", verbosity);
    return true;
  } catch (npmError) {
    error(`Failed to install Internxt CLI: ${npmError}`);
    error("Please install it manually using one of these commands:");
    always(chalk2.yellow("bun install -g @internxt/cli"));
    always(chalk2.yellow("or"));
    always(chalk2.yellow("npm install -g @internxt/cli"));
    return false;
  }
}
async function checkLoggedIn(verbosity) {
  info("Checking if logged in to Internxt...", verbosity);
  try {
    const result = await runCommandWithFallback("internxt whoami", "npx @internxt/cli whoami", {}, verbosity);
    if (result && result.stdout) {
      if (result.stdout.includes("You are logged in as:")) {
        const emailMatch = result.stdout.match(/You are logged in as:\s*(.*)/i);
        const email = emailMatch ? emailMatch[1].trim() : "unknown user";
        success(`Logged in as ${email}`, verbosity);
        return { loggedIn: true, email };
      }
      if (result.stdout.includes("You are not logged in")) {
        warning("Not logged in to Internxt.", verbosity);
        return { loggedIn: false, email: null };
      }
    }
  } catch (error2) {
    verbose("Could not check login status with whoami.", verbosity);
  }
  warning("Unable to determine login status, assuming not logged in.", verbosity);
  return { loggedIn: false, email: null };
}
async function createCredentialsFile(email, password, twoFactorCode = null) {
  const randomId = randomBytes(16).toString("hex");
  const tempDir = os2.tmpdir();
  const filePath = path.join(tempDir, `internxt-creds-${randomId}.json`);
  const credentials = {
    email,
    password,
    ...twoFactorCode ? { twoFactorCode } : {}
  };
  await fs.promises.writeFile(filePath, JSON.stringify(credentials), {
    encoding: "utf8",
    mode: 384
  });
  const cleanup = async () => {
    try {
      await fs.promises.unlink(filePath);
    } catch (error2) {
    }
  };
  return { filePath, cleanup };
}
async function directLogin(email, password, twoFactorCode, verbosity) {
  let credFile = null;
  let cleanup = null;
  try {
    ({ filePath: credFile, cleanup } = await createCredentialsFile(email, password, twoFactorCode));
    const cmdVerbosity = Verbosity.Quiet;
    let result = await runCommandWithFallback(`internxt auth login --credentials-file "${credFile}"`, `npx @internxt/cli auth login --credentials-file "${credFile}"`, {
      env: {
        ...process.env,
        CI: "1",
        NON_INTERACTIVE: "1"
      }
    }, cmdVerbosity);
    if (!result || result.stderr?.includes("unknown option")) {
      let fallbackArgs = ["login", "--email", email];
      if (twoFactorCode) {
        fallbackArgs.push("--two-factor", twoFactorCode);
      }
      result = await runCommandWithFallback(`internxt ${fallbackArgs.join(" ")}`, `npx @internxt/cli ${fallbackArgs.join(" ")}`, {
        env: {
          ...process.env,
          CI: "1",
          NON_INTERACTIVE: "1"
        },
        input: password + `
`
      }, cmdVerbosity);
    }
    if (result && result.stdout) {
      if (result.stdout.includes("Welcome") || result.stdout.includes("successfully") || result.stdout.includes("Logged in")) {
        success("Successfully logged in to Internxt", verbosity);
        return true;
      }
      if (result.stdout.includes("two-factor") || result.stdout.includes("2FA")) {
        if (!twoFactorCode) {
          return false;
        }
      }
      if (result.stdout.includes("Invalid credentials") || result.stdout.includes("Authentication failed")) {
        error("Invalid credentials", verbosity);
        return false;
      }
    }
    return false;
  } catch (error2) {
    verbose(`Direct login failed: ${error2.message}`, verbosity);
    return false;
  } finally {
    if (cleanup) {
      try {
        await cleanup();
      } catch (err) {
        verbose("Failed to clean up temporary credentials file", verbosity);
      }
    }
  }
}
function getSessionFilePath() {
  const homeDir = os2.homedir();
  const configDir = path.join(homeDir, ".internxt");
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { mode: 448 });
  }
  return path.join(configDir, "session.json");
}
async function checkForExistingSession(verbosity) {
  try {
    const homeDir = os2.homedir();
    const possibleTokenDirs = [
      path.join(homeDir, ".config", "internxt"),
      path.join(homeDir, ".internxt"),
      path.join(homeDir, ".config", "@internxt"),
      path.join(homeDir, "AppData", "Roaming", "internxt")
    ];
    for (const dir of possibleTokenDirs) {
      if (fs.existsSync(dir)) {
        const files = await fs.promises.readdir(dir);
        const tokenFiles = files.filter((file) => file.includes("auth") || file.includes("token") || file.includes("session"));
        if (tokenFiles.length > 0) {
          verbose(`Found existing session token in ${dir}`, verbosity);
          return true;
        }
      }
    }
    return false;
  } catch (error2) {
    verbose(`Error checking for existing session: ${error2.message}`, verbosity);
    return false;
  }
}
async function saveUserEmail(email) {
  try {
    const filePath = getSessionFilePath();
    const sessionInfo = {
      email,
      lastLoginTimestamp: Date.now()
    };
    await fs.promises.writeFile(filePath, JSON.stringify(sessionInfo), {
      encoding: "utf8",
      mode: 384
    });
    return true;
  } catch (error2) {
    error(`Failed to save session info: ${error2.message}`);
    return false;
  }
}
async function loadUserEmail() {
  try {
    const filePath = getSessionFilePath();
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const data = await fs.promises.readFile(filePath, "utf8");
    const sessionInfo = JSON.parse(data);
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    if (Date.now() - sessionInfo.lastLoginTimestamp > thirtyDaysMs) {
      warning("Session information has expired.");
      return null;
    }
    return sessionInfo.email;
  } catch (error2) {
    verbose(`Failed to load session info: ${error2.message}`);
    return null;
  }
}
async function loginWithExistingSession(verbosity) {
  const hasSession = await checkForExistingSession(verbosity);
  if (!hasSession) {
    return false;
  }
  try {
    const email = await loadUserEmail();
    if (email) {
      info(`Using existing session for ${email}...`, verbosity);
    } else {
      info(`Using existing session...`, verbosity);
    }
    const result = await runCommandWithFallback("internxt whoami", "npx @internxt/cli whoami", {}, Verbosity.Quiet);
    if (result && result.stdout && result.stdout.includes("You are logged in as:")) {
      const emailMatch = result.stdout.match(/You are logged in as:\s*(.*)/i);
      const sessionEmail = emailMatch ? emailMatch[1].trim() : "your account";
      success(`Already logged in as ${sessionEmail}`, verbosity);
      if (!email || email !== sessionEmail) {
        await saveUserEmail(sessionEmail);
      }
      return true;
    }
    return false;
  } catch (error2) {
    verbose(`Failed to use existing session: ${error2.message}`, verbosity);
    return false;
  }
}
async function simpleLogin(email, password, verbosity) {
  try {
    info("Logging in directly via CLI...", verbosity);
    const child = __require("child_process").spawn("internxt", ["login"], {
      stdio: ["pipe", "pipe", "pipe"],
      shell: true,
      env: {
        ...process.env,
        CI: "1",
        NON_INTERACTIVE: "1",
        INTERNXT_EMAIL: email,
        INTERNXT_PASSWORD: password
      }
    });
    let stdoutData = "";
    let stderrData = "";
    child.stdout.on("data", (data) => {
      const output = data.toString();
      stdoutData += output;
      if (verbosity >= Verbosity.Verbose) {
        verbose(`Output: ${output}`, verbosity);
      }
    });
    child.stderr.on("data", (data) => {
      const error2 = data.toString();
      stderrData += error2;
      if (verbosity >= Verbosity.Verbose) {
        verbose(`Error: ${error2}`, verbosity);
      }
    });
    const timeout = setTimeout(() => {
      warning("Login process is taking too long, terminating...", verbosity);
      child.kill("SIGTERM");
    }, 15000);
    return new Promise((resolve) => {
      child.on("close", (code) => {
        clearTimeout(timeout);
        if (code === 0 || stdoutData.includes("Welcome") || stdoutData.includes("successfully")) {
          success("Login successful", verbosity);
          resolve(true);
        } else {
          if (stdoutData.includes("two-factor") || stdoutData.includes("2FA")) {
            info("2FA required - falling back to manual method", verbosity);
            resolve(false);
          } else {
            error(`Login process exited with code ${code}`, verbosity);
            resolve(false);
          }
        }
      });
    });
  } catch (error2) {
    error(`Simple login error: ${error2.message}`, verbosity);
    return false;
  }
}
async function login(verbosity) {
  try {
    const sessionLoginSuccess = await loginWithExistingSession(verbosity);
    if (sessionLoginSuccess) {
      return true;
    }
    const savedEmail = await loadUserEmail();
    always(chalk2.blue("Please log in to your Internxt account."));
    let email;
    let isEmailValid = false;
    while (!isEmailValid) {
      email = await promptUser2(chalk2.blue(`Email${savedEmail ? ` (${savedEmail})` : ""}: `));
      if (!email && savedEmail) {
        email = savedEmail;
      }
      if (!isValidEmail(email)) {
        error("Invalid email format. Please enter a valid email address.");
        continue;
      }
      isEmailValid = true;
    }
    const password = await promptPassword(chalk2.blue("Password"));
    const simpleLoginSuccess = await simpleLogin(email, password, verbosity);
    if (simpleLoginSuccess) {
      await saveUserEmail(email);
      return true;
    }
    const directLoginSuccess = await directLogin(email, password, null, verbosity);
    if (directLoginSuccess) {
      await saveUserEmail(email);
      return true;
    }
    info("You may need to enter a two-factor authentication code.", verbosity);
    const twoFactorCode = await promptUser2(chalk2.blue("Two-factor code (if required): "));
    if (twoFactorCode && twoFactorCode.length > 0) {
      if (!/^\d{6}$/.test(twoFactorCode)) {
        warning("Two-factor code should be 6 digits.", verbosity);
      }
      const twoFactorLoginSuccess = await directLogin(email, password, twoFactorCode, verbosity);
      if (twoFactorLoginSuccess) {
        await saveUserEmail(email);
        return true;
      }
    }
    error("All login attempts failed. Please try again or use the CLI directly: 'internxt login'", verbosity);
    return false;
  } catch (error2) {
    error(`Login error: ${error2.message}`, verbosity);
    return false;
  }
}
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
async function checkWebDAVEnabled(verbosity) {
  info("Checking if WebDAV is enabled...", verbosity);
  try {
    const queryVerbosity = Verbosity.Quiet;
    const result = await runCommandWithFallback("internxt webdav status", "npx @internxt/cli webdav status", {}, queryVerbosity);
    if (result && result.stdout) {
      if (result.stdout.includes("status: online") || result.stdout.includes("WebDav server status: online") || result.stdout.includes("WebDAV server is running")) {
        let match = result.stdout.match(/localhost IP at: (https?:\/\/[^\s\n"']+)/i);
        if (!match) {
          match = result.stdout.match(/at (https?:\/\/[^\s\n"']+)/i);
        }
        if (!match) {
          match = result.stdout.match(/(https?:\/\/[^\s\n"']+)/i);
        }
        if (match && match[1]) {
          const url = match[1].trim();
          const localhostUrl = url.replace(/webdav\.local\.internxt\.com/, "127.0.0.1");
          success(`WebDAV is enabled at ${localhostUrl}`, verbosity);
          return { enabled: true, url: localhostUrl };
        }
        const enableResult = await runCommandWithFallback("internxt webdav enable", "npx @internxt/cli webdav enable", {}, queryVerbosity);
        if (enableResult && enableResult.stdout) {
          match = enableResult.stdout.match(/localhost IP at: (https?:\/\/[^\s\n"']+)/i);
          if (!match) {
            match = enableResult.stdout.match(/at (https?:\/\/[^\s\n"']+)/i);
          }
          if (match && match[1]) {
            const url = match[1].trim();
            const localhostUrl = url.replace(/webdav\.local\.internxt\.com/, "127.0.0.1");
            success(`WebDAV is enabled at ${localhostUrl}`, verbosity);
            return { enabled: true, url: localhostUrl };
          }
        }
        warning("WebDAV is enabled but couldn't determine the URL.", verbosity);
        return { enabled: true, url: null };
      }
    }
  } catch (error2) {
    verbose("Could not check WebDAV status.", verbosity);
  }
  warning("WebDAV is not enabled.", verbosity);
  return { enabled: false, url: null };
}
async function enableWebDAV(verbosity) {
  info("Enabling WebDAV...", verbosity);
  try {
    const setupVerbosity = Verbosity.Quiet;
    info("Configuring WebDAV to use HTTP...", verbosity);
    const configResult = await runCommandWithFallback("internxt webdav-config --http", "npx @internxt/cli webdav-config --http", {}, setupVerbosity);
    if (!configResult || configResult.stderr) {
      error("Failed to configure WebDAV", verbosity);
      return { success: false, url: null };
    }
    info("Starting WebDAV server...", verbosity);
    const enableResult = await runCommandWithFallback("internxt webdav enable", "npx @internxt/cli webdav enable", {}, setupVerbosity);
    if (!enableResult || enableResult.stderr) {
      error("Failed to enable WebDAV", verbosity);
      return { success: false, url: null };
    }
    info("Waiting for WebDAV server to start...", verbosity);
    await new Promise((resolve) => setTimeout(resolve, 1e4));
    const status = await checkWebDAVEnabled(verbosity);
    if (status.enabled) {
      try {
        const curlResult = await runCommandWithFallback('curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 --insecure http://127.0.0.1:3005', 'curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 --insecure http://127.0.0.1:3005', {}, setupVerbosity);
        if (curlResult && curlResult.stdout && curlResult.stdout.trim() === "200") {
          success(`WebDAV server is now running and accepting connections at ${status.url}`, verbosity);
          return { success: true, url: status.url };
        } else {
          warning("WebDAV server is running but not accepting connections yet. Waiting longer...", verbosity);
          await new Promise((resolve) => setTimeout(resolve, 1e4));
          const retryCurlResult = await runCommandWithFallback('curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 --insecure http://127.0.0.1:3005', 'curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 --insecure http://127.0.0.1:3005', {}, setupVerbosity);
          if (retryCurlResult && retryCurlResult.stdout && retryCurlResult.stdout.trim() === "200") {
            success(`WebDAV server is now running and accepting connections at ${status.url}`, verbosity);
            return { success: true, url: status.url };
          }
        }
      } catch (curlError) {
        warning("Could not verify WebDAV server connection, but server appears to be running", verbosity);
        return { success: true, url: status.url };
      }
    }
    error("Failed to verify WebDAV server is running and accepting connections", verbosity);
    return { success: false, url: null };
  } catch (error2) {
    error(`Failed to enable WebDAV: ${error2}`);
    return { success: false, url: null };
  }
}

// src/core/cli-commands.js
import chalk2 from "chalk";
import * as fs from "fs";
import * as path from "path";
import * as os2 from "os";
import { randomBytes } from "crypto";
async function checkInternxtInstalled(verbosity) {
  info("Checking if Internxt CLI is installed...", verbosity);
  try {
    const result = await runCommandWithFallback("internxt --version", "npx @internxt/cli --version", {}, verbosity);
    if (result) {
      const version = result.stdout.trim();
      success(`Internxt CLI is installed (version: ${version})`, verbosity);
      return { installed: true, version };
    }
  } catch (error2) {
    warning("Internxt CLI is not installed yet.", verbosity);
  }
  return { installed: false, version: null };
}
async function installInternxtCLI(verbosity) {
  info("Installing Internxt CLI globally...", verbosity);
  try {
    if (isBunEnvironment()) {
      try {
        info("Trying installation with Bun...", verbosity);
        await runCommand2("bun install -g @internxt/cli", {}, verbosity);
        success("Internxt CLI installed successfully with Bun! You can now use the 'internxt' command.", verbosity);
        return true;
      } catch (bunError) {
        warning(`Bun installation failed: ${bunError}`, verbosity);
      }
    }
    info("Trying installation with npm...", verbosity);
    await runCommand2("npm install -g @internxt/cli", {}, verbosity);
    success("Internxt CLI installed successfully with npm! You can now use the 'internxt' command.", verbosity);
    return true;
  } catch (npmError) {
    error(`Failed to install Internxt CLI: ${npmError}`);
    error("Please install it manually using one of these commands:");
    always(chalk2.yellow("bun install -g @internxt/cli"));
    always(chalk2.yellow("or"));
    always(chalk2.yellow("npm install -g @internxt/cli"));
    return false;
  }
}
async function checkLoggedIn(verbosity) {
  info("Checking if logged in to Internxt...", verbosity);
  try {
    const result = await runCommandWithFallback("internxt whoami", "npx @internxt/cli whoami", {}, verbosity);
    if (result && result.stdout) {
      if (result.stdout.includes("You are logged in as:")) {
        const emailMatch = result.stdout.match(/You are logged in as:\s*(.*)/i);
        const email = emailMatch ? emailMatch[1].trim() : "unknown user";
        success(`Logged in as ${email}`, verbosity);
        return { loggedIn: true, email };
      }
      if (result.stdout.includes("You are not logged in")) {
        warning("Not logged in to Internxt.", verbosity);
        return { loggedIn: false, email: null };
      }
    }
  } catch (error2) {
    verbose("Could not check login status with whoami.", verbosity);
  }
  warning("Unable to determine login status, assuming not logged in.", verbosity);
  return { loggedIn: false, email: null };
}
async function createCredentialsFile(email, password, twoFactorCode = null) {
  const randomId = randomBytes(16).toString("hex");
  const tempDir = os2.tmpdir();
  const filePath = path.join(tempDir, `internxt-creds-${randomId}.json`);
  const credentials = {
    email,
    password,
    ...twoFactorCode ? { twoFactorCode } : {}
  };
  await fs.promises.writeFile(filePath, JSON.stringify(credentials), {
    encoding: "utf8",
    mode: 384
  });
  const cleanup = async () => {
    try {
      await fs.promises.unlink(filePath);
    } catch (error2) {
    }
  };
  return { filePath, cleanup };
}
async function directLogin(email, password, twoFactorCode, verbosity) {
  let credFile = null;
  let cleanup = null;
  try {
    ({ filePath: credFile, cleanup } = await createCredentialsFile(email, password, twoFactorCode));
    const cmdVerbosity = Verbosity.Quiet;
    let result = await runCommandWithFallback(`internxt auth login --credentials-file "${credFile}"`, `npx @internxt/cli auth login --credentials-file "${credFile}"`, {
      env: {
        ...process.env,
        CI: "1",
        NON_INTERACTIVE: "1"
      }
    }, cmdVerbosity);
    if (!result || result.stderr?.includes("unknown option")) {
      let fallbackArgs = ["login", "--email", email];
      if (twoFactorCode) {
        fallbackArgs.push("--two-factor", twoFactorCode);
      }
      result = await runCommandWithFallback(`internxt ${fallbackArgs.join(" ")}`, `npx @internxt/cli ${fallbackArgs.join(" ")}`, {
        env: {
          ...process.env,
          CI: "1",
          NON_INTERACTIVE: "1"
        },
        input: password + `
`
      }, cmdVerbosity);
    }
    if (result && result.stdout) {
      if (result.stdout.includes("Welcome") || result.stdout.includes("successfully") || result.stdout.includes("Logged in")) {
        success("Successfully logged in to Internxt", verbosity);
        return true;
      }
      if (result.stdout.includes("two-factor") || result.stdout.includes("2FA")) {
        if (!twoFactorCode) {
          return false;
        }
      }
      if (result.stdout.includes("Invalid credentials") || result.stdout.includes("Authentication failed")) {
        error("Invalid credentials", verbosity);
        return false;
      }
    }
    return false;
  } catch (error2) {
    verbose(`Direct login failed: ${error2.message}`, verbosity);
    return false;
  } finally {
    if (cleanup) {
      try {
        await cleanup();
      } catch (err) {
        verbose("Failed to clean up temporary credentials file", verbosity);
      }
    }
  }
}
function getSessionFilePath() {
  const homeDir = os2.homedir();
  const configDir = path.join(homeDir, ".internxt");
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { mode: 448 });
  }
  return path.join(configDir, "session.json");
}
async function checkForExistingSession(verbosity) {
  try {
    const homeDir = os2.homedir();
    const possibleTokenDirs = [
      path.join(homeDir, ".config", "internxt"),
      path.join(homeDir, ".internxt"),
      path.join(homeDir, ".config", "@internxt"),
      path.join(homeDir, "AppData", "Roaming", "internxt")
    ];
    for (const dir of possibleTokenDirs) {
      if (fs.existsSync(dir)) {
        const files = await fs.promises.readdir(dir);
        const tokenFiles = files.filter((file) => file.includes("auth") || file.includes("token") || file.includes("session"));
        if (tokenFiles.length > 0) {
          verbose(`Found existing session token in ${dir}`, verbosity);
          return true;
        }
      }
    }
    return false;
  } catch (error2) {
    verbose(`Error checking for existing session: ${error2.message}`, verbosity);
    return false;
  }
}
async function saveUserEmail(email) {
  try {
    const filePath = getSessionFilePath();
    const sessionInfo = {
      email,
      lastLoginTimestamp: Date.now()
    };
    await fs.promises.writeFile(filePath, JSON.stringify(sessionInfo), {
      encoding: "utf8",
      mode: 384
    });
    return true;
  } catch (error2) {
    error(`Failed to save session info: ${error2.message}`);
    return false;
  }
}
async function loadUserEmail() {
  try {
    const filePath = getSessionFilePath();
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const data = await fs.promises.readFile(filePath, "utf8");
    const sessionInfo = JSON.parse(data);
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    if (Date.now() - sessionInfo.lastLoginTimestamp > thirtyDaysMs) {
      warning("Session information has expired.");
      return null;
    }
    return sessionInfo.email;
  } catch (error2) {
    verbose(`Failed to load session info: ${error2.message}`);
    return null;
  }
}
async function loginWithExistingSession(verbosity) {
  const hasSession = await checkForExistingSession(verbosity);
  if (!hasSession) {
    return false;
  }
  try {
    const email = await loadUserEmail();
    if (email) {
      info(`Using existing session for ${email}...`, verbosity);
    } else {
      info(`Using existing session...`, verbosity);
    }
    const result = await runCommandWithFallback("internxt whoami", "npx @internxt/cli whoami", {}, Verbosity.Quiet);
    if (result && result.stdout && result.stdout.includes("You are logged in as:")) {
      const emailMatch = result.stdout.match(/You are logged in as:\s*(.*)/i);
      const sessionEmail = emailMatch ? emailMatch[1].trim() : "your account";
      success(`Already logged in as ${sessionEmail}`, verbosity);
      if (!email || email !== sessionEmail) {
        await saveUserEmail(sessionEmail);
      }
      return true;
    }
    return false;
  } catch (error2) {
    verbose(`Failed to use existing session: ${error2.message}`, verbosity);
    return false;
  }
}
async function simpleLogin(email, password, verbosity) {
  try {
    info("Logging in directly via CLI...", verbosity);
    const child = __require("child_process").spawn("internxt", ["login"], {
      stdio: ["pipe", "pipe", "pipe"],
      shell: true,
      env: {
        ...process.env,
        CI: "1",
        NON_INTERACTIVE: "1",
        INTERNXT_EMAIL: email,
        INTERNXT_PASSWORD: password
      }
    });
    let stdoutData = "";
    let stderrData = "";
    child.stdout.on("data", (data) => {
      const output = data.toString();
      stdoutData += output;
      if (verbosity >= Verbosity.Verbose) {
        verbose(`Output: ${output}`, verbosity);
      }
    });
    child.stderr.on("data", (data) => {
      const error2 = data.toString();
      stderrData += error2;
      if (verbosity >= Verbosity.Verbose) {
        verbose(`Error: ${error2}`, verbosity);
      }
    });
    const timeout = setTimeout(() => {
      warning("Login process is taking too long, terminating...", verbosity);
      child.kill("SIGTERM");
    }, 15000);
    return new Promise((resolve) => {
      child.on("close", (code) => {
        clearTimeout(timeout);
        if (code === 0 || stdoutData.includes("Welcome") || stdoutData.includes("successfully")) {
          success("Login successful", verbosity);
          resolve(true);
        } else {
          if (stdoutData.includes("two-factor") || stdoutData.includes("2FA")) {
            info("2FA required - falling back to manual method", verbosity);
            resolve(false);
          } else {
            error(`Login process exited with code ${code}`, verbosity);
            resolve(false);
          }
        }
      });
    });
  } catch (error2) {
    error(`Simple login error: ${error2.message}`, verbosity);
    return false;
  }
}
async function login(verbosity) {
  try {
    const sessionLoginSuccess = await loginWithExistingSession(verbosity);
    if (sessionLoginSuccess) {
      return true;
    }
    const savedEmail = await loadUserEmail();
    always(chalk2.blue("Please log in to your Internxt account."));
    let email;
    let isEmailValid = false;
    while (!isEmailValid) {
      email = await promptUser2(chalk2.blue(`Email${savedEmail ? ` (${savedEmail})` : ""}: `));
      if (!email && savedEmail) {
        email = savedEmail;
      }
      if (!isValidEmail(email)) {
        error("Invalid email format. Please enter a valid email address.");
        continue;
      }
      isEmailValid = true;
    }
    const password = await promptPassword(chalk2.blue("Password"));
    const simpleLoginSuccess = await simpleLogin(email, password, verbosity);
    if (simpleLoginSuccess) {
      await saveUserEmail(email);
      return true;
    }
    const directLoginSuccess = await directLogin(email, password, null, verbosity);
    if (directLoginSuccess) {
      await saveUserEmail(email);
      return true;
    }
    info("You may need to enter a two-factor authentication code.", verbosity);
    const twoFactorCode = await promptUser2(chalk2.blue("Two-factor code (if required): "));
    if (twoFactorCode && twoFactorCode.length > 0) {
      if (!/^\d{6}$/.test(twoFactorCode)) {
        warning("Two-factor code should be 6 digits.", verbosity);
      }
      const twoFactorLoginSuccess = await directLogin(email, password, twoFactorCode, verbosity);
      if (twoFactorLoginSuccess) {
        await saveUserEmail(email);
        return true;
      }
    }
    error("All login attempts failed. Please try again or use the CLI directly: 'internxt login'", verbosity);
    return false;
  } catch (error2) {
    error(`Login error: ${error2.message}`, verbosity);
    return false;
  }
}
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
async function checkWebDAVEnabled(verbosity) {
  info("Checking if WebDAV is enabled...", verbosity);
  try {
    const queryVerbosity = Verbosity.Quiet;
    const result = await runCommandWithFallback("internxt webdav status", "npx @internxt/cli webdav status", {}, queryVerbosity);
    if (result && result.stdout) {
      if (result.stdout.includes("status: online") || result.stdout.includes("WebDav server status: online") || result.stdout.includes("WebDAV server is running")) {
        let match = result.stdout.match(/localhost IP at: (https?:\/\/[^\s\n"']+)/i);
        if (!match) {
          match = result.stdout.match(/at (https?:\/\/[^\s\n"']+)/i);
        }
        if (!match) {
          match = result.stdout.match(/(https?:\/\/[^\s\n"']+)/i);
        }
        if (match && match[1]) {
          const url = match[1].trim();
          const localhostUrl = url.replace(/webdav\.local\.internxt\.com/, "127.0.0.1");
          success(`WebDAV is enabled at ${localhostUrl}`, verbosity);
          return { enabled: true, url: localhostUrl };
        }
        const enableResult = await runCommandWithFallback("internxt webdav enable", "npx @internxt/cli webdav enable", {}, queryVerbosity);
        if (enableResult && enableResult.stdout) {
          match = enableResult.stdout.match(/localhost IP at: (https?:\/\/[^\s\n"']+)/i);
          if (!match) {
            match = enableResult.stdout.match(/at (https?:\/\/[^\s\n"']+)/i);
          }
          if (match && match[1]) {
            const url = match[1].trim();
            const localhostUrl = url.replace(/webdav\.local\.internxt\.com/, "127.0.0.1");
            success(`WebDAV is enabled at ${localhostUrl}`, verbosity);
            return { enabled: true, url: localhostUrl };
          }
        }
        warning("WebDAV is enabled but couldn't determine the URL.", verbosity);
        return { enabled: true, url: null };
      }
    }
  } catch (error2) {
    verbose("Could not check WebDAV status.", verbosity);
  }
  warning("WebDAV is not enabled.", verbosity);
  return { enabled: false, url: null };
}
async function enableWebDAV(verbosity) {
  info("Enabling WebDAV...", verbosity);
  try {
    const setupVerbosity = Verbosity.Quiet;
    info("Configuring WebDAV to use HTTP...", verbosity);
    const configResult = await runCommandWithFallback("internxt webdav-config --http", "npx @internxt/cli webdav-config --http", {}, setupVerbosity);
    if (!configResult || configResult.stderr) {
      error("Failed to configure WebDAV", verbosity);
      return { success: false, url: null };
    }
    info("Starting WebDAV server...", verbosity);
    const enableResult = await runCommandWithFallback("internxt webdav enable", "npx @internxt/cli webdav enable", {}, setupVerbosity);
    if (!enableResult || enableResult.stderr) {
      error("Failed to enable WebDAV", verbosity);
      return { success: false, url: null };
    }
    info("Waiting for WebDAV server to start...", verbosity);
    await new Promise((resolve) => setTimeout(resolve, 1e4));
    const status = await checkWebDAVEnabled(verbosity);
    if (status.enabled) {
      try {
        const curlResult = await runCommandWithFallback('curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 --insecure http://127.0.0.1:3005', 'curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 --insecure http://127.0.0.1:3005', {}, setupVerbosity);
        if (curlResult && curlResult.stdout && curlResult.stdout.trim() === "200") {
          success(`WebDAV server is now running and accepting connections at ${status.url}`, verbosity);
          return { success: true, url: status.url };
        } else {
          warning("WebDAV server is running but not accepting connections yet. Waiting longer...", verbosity);
          await new Promise((resolve) => setTimeout(resolve, 1e4));
          const retryCurlResult = await runCommandWithFallback('curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 --insecure http://127.0.0.1:3005', 'curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 --insecure http://127.0.0.1:3005', {}, setupVerbosity);
          if (retryCurlResult && retryCurlResult.stdout && retryCurlResult.stdout.trim() === "200") {
            success(`WebDAV server is now running and accepting connections at ${status.url}`, verbosity);
            return { success: true, url: status.url };
          }
        }
      } catch (curlError) {
        warning("Could not verify WebDAV server connection, but server appears to be running", verbosity);
        return { success: true, url: status.url };
      }
    }
    error("Failed to verify WebDAV server is running and accepting connections", verbosity);
    return { success: false, url: null };
  } catch (error2) {
    error(`Failed to enable WebDAV: ${error2}`);
    return { success: false, url: null };
  }
}

// src/core/internxt-cli.js
class InternxtCLI {
  constructor(verbosity = Verbosity.Normal) {
    this.verbosity = verbosity;
    this.config = {
      isInstalled: false,
      isLoggedIn: false,
      webdavEnabled: false,
      webdavUrl: null
    };
  }
  async checkInstalled() {
    const { installed } = await checkInternxtInstalled(this.verbosity);
    this.config.isInstalled = installed;
    return installed;
  }
  async install() {
    const success2 = await installInternxtCLI(this.verbosity);
    if (success2) {
      this.config.isInstalled = true;
    }
    return success2;
  }
  async checkLoggedIn() {
    const { loggedIn, email } = await checkLoggedIn(this.verbosity);
    this.config.isLoggedIn = loggedIn;
    if (loggedIn) {
      this.config.email = email;
    }
    return loggedIn;
  }
  async login() {
    try {
      const { loggedIn } = await checkLoggedIn(Verbosity.Quiet);
      if (loggedIn) {
        success("Already logged in to Internxt!", this.verbosity);
        this.config.isLoggedIn = true;
        return true;
      }
      let attempts = 0;
      const maxAttempts = 3;
      while (attempts < maxAttempts) {
        attempts++;
        const success2 = await login(this.verbosity);
        if (success2) {
          this.config.isLoggedIn = true;
          return true;
        }
        if (attempts >= maxAttempts) {
          error(`Failed to login after ${maxAttempts} attempts.`);
          return false;
        }
        info(`Attempt ${attempts}/${maxAttempts} failed. Trying again...`);
      }
      return false;
    } catch (error2) {
      error(`Login error: ${error2.message}`);
      return false;
    }
  }
  async checkWebDAVEnabled() {
    const { enabled, url } = await checkWebDAVEnabled(this.verbosity);
    this.config.webdavEnabled = enabled;
    if (enabled && url) {
      this.config.webdavUrl = url;
    }
    return enabled;
  }
  async enableWebDAV() {
    const { success: success2, url } = await enableWebDAV(this.verbosity);
    if (success2) {
      this.config.webdavEnabled = true;
      if (url) {
        this.config.webdavUrl = url;
      }
    }
    return success2;
  }
  async setup() {
    try {
      if (!await this.checkInstalled()) {
        if (!await this.install()) {
          error("Failed to install Internxt CLI. Please install it manually.");
          return false;
        }
      }
      if (!await this.login()) {
        error("Authentication failed. Cannot proceed without being logged in.");
        return false;
      }
      if (await this.checkWebDAVEnabled()) {
        return true;
      }
      if (!await this.enableWebDAV()) {
        error("Failed to enable WebDAV. Cannot proceed.");
        return false;
      }
      return true;
    } catch (error2) {
      error(`Setup failed: ${error2.message}`);
      return false;
    }
  }
  getWebDAVUrl() {
    return this.config.webdavUrl;
  }
  setWebDAVUrl(url) {
    this.config.webdavUrl = url;
    this.config.webdavEnabled = true;
  }
}

// src/core/file-scanner.js
import fs3 from "fs";
import path2 from "path";

// src/utils/fs-utils.js
import fs2 from "fs";
import crypto from "crypto";
import { promisify as promisify4 } from "util";
var existsAsync = promisify4(fs2.exists);
var mkdirAsync = promisify4(fs2.mkdir);
var readFileAsync = promisify4(fs2.readFile);
var writeFileAsync = promisify4(fs2.writeFile);
function urlEncodePath(path2) {
  return path2.split("/").map((component) => encodeURIComponent(component)).join("/");
}
async function calculateChecksum(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("md5");
    const stream = fs2.createReadStream(filePath);
    stream.on("data", (data) => hash.update(data));
    stream.on("end", () => resolve(hash.digest("hex")));
    stream.on("error", (error2) => reject(error2));
  });
}
async function saveJsonToFile(filePath, data) {
  try {
    await writeFileAsync(filePath, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (error2) {
    console.error(`Error saving JSON to ${filePath}:`, error2);
    return false;
  }
}
async function loadJsonFromFile(filePath, defaultValue = {}) {
  try {
    if (await existsAsync(filePath)) {
      const data = await readFileAsync(filePath, "utf8");
      return JSON.parse(data);
    }
    return defaultValue;
  } catch (error2) {
    console.error(`Error loading JSON from ${filePath}:`, error2);
    return defaultValue;
  }
}

// src/core/file-scanner.js
class FileScanner {
  constructor(sourceDir, verbosity = Verbosity.Normal) {
    this.sourceDir = path2.resolve(sourceDir);
    this.statePath = path2.join(this.sourceDir, ".internxt-upload-state.json");
    this.uploadState = { files: {}, lastRun: "" };
    this.verbosity = verbosity;
  }
  async loadState() {
    this.uploadState = await loadJsonFromFile(this.statePath, { files: {}, lastRun: "" });
    verbose(`Loaded state with ${Object.keys(this.uploadState.files).length} saved file checksums`, this.verbosity);
  }
  async saveState() {
    await saveJsonToFile(this.statePath, this.uploadState);
    verbose(`Saved state with ${Object.keys(this.uploadState.files).length} file checksums`, this.verbosity);
  }
  updateFileState(relativePath, checksum) {
    this.uploadState.files[relativePath] = checksum;
  }
  recordCompletion() {
    this.uploadState.lastRun = new Date().toISOString();
  }
  async scanDirectory(dir, baseDir = this.sourceDir) {
    try {
      const entries = fs3.readdirSync(dir, { withFileTypes: true });
      const files = [];
      for (const entry of entries) {
        const fullPath = path2.join(dir, entry.name);
        const relativePath = path2.relative(baseDir, fullPath);
        if (entry.name.startsWith(".") || fullPath === this.statePath) {
          continue;
        }
        if (entry.isDirectory()) {
          const subDirFiles = await this.scanDirectory(fullPath, baseDir);
          files.push(...subDirFiles);
        } else if (entry.isFile()) {
          const stats = fs3.statSync(fullPath);
          verbose(`Calculating checksum for ${relativePath}`, this.verbosity);
          const checksum = await calculateChecksum(fullPath);
          files.push({
            relativePath,
            absolutePath: fullPath,
            size: stats.size,
            checksum
          });
        }
      }
      return files;
    } catch (error2) {
      error(`Error scanning directory ${dir}: ${error2.message}`);
      return [];
    }
  }
  determineFilesToUpload(files) {
    return files.filter((file) => {
      const existingChecksum = this.uploadState.files[file.relativePath];
      return !existingChecksum || existingChecksum !== file.checksum;
    });
  }
  async scan() {
    info("Scanning directory...", this.verbosity);
    await this.loadState();
    const allFiles = await this.scanDirectory(this.sourceDir);
    info(`Found ${allFiles.length} files.`, this.verbosity);
    const filesToUpload = this.determineFilesToUpload(allFiles);
    info(`${filesToUpload.length} files need to be uploaded.`, this.verbosity);
    const totalSizeBytes = filesToUpload.reduce((sum, file) => sum + file.size, 0);
    const totalSizeMB = (totalSizeBytes / (1024 * 1024)).toFixed(2);
    if (filesToUpload.length > 0) {
      info(`Total upload size: ${totalSizeMB} MB.`, this.verbosity);
    }
    return {
      allFiles,
      filesToUpload,
      totalSizeBytes,
      totalSizeMB
    };
  }
}

// src/core/uploader.js
import path3 from "path";
import chalk3 from "chalk";

// src/core/webdav-service.js
import { promisify as promisify5 } from "util";
import { exec as exec4 } from "child_process";
var execAsync4 = promisify5(exec4);

class WebDAVService {
  constructor(webdavUrl, verbosity = Verbosity.Normal) {
    this.webdavUrl = webdavUrl;
    this.verbosity = verbosity;
  }
  async createDirectory(dirPath, targetDir = "") {
    try {
      const fullDirPath = targetDir ? `${targetDir}/${dirPath}` : dirPath;
      const encodedPath = urlEncodePath(fullDirPath);
      verbose(`Creating directory: /${fullDirPath}`, this.verbosity);
      await runCommand2(`curl --insecure -X MKCOL "${this.webdavUrl}/${encodedPath}"`, {}, this.verbosity);
      return true;
    } catch (error2) {
      verbose(`Directory might already exist: ${dirPath}`, this.verbosity);
      return false;
    }
  }
  async createDirectoryStructure(targetDir) {
    if (!targetDir) {
      return true;
    }
    try {
      const segments = targetDir.split("/");
      let currentPath = "";
      for (const segment of segments) {
        if (segment) {
          currentPath = currentPath ? `${currentPath}/${segment}` : segment;
          const encodedPath = urlEncodePath(currentPath);
          verbose(`Ensuring directory exists: /${currentPath}`, this.verbosity);
          await runCommand2(`curl --insecure -X MKCOL "${this.webdavUrl}/${encodedPath}"`, {}, this.verbosity);
        }
      }
      success(`Directory structure prepared: /${targetDir}`, this.verbosity);
      return true;
    } catch (error2) {
      warning(`Directory structure might already exist or couldn't be created. Continuing anyway.`, this.verbosity);
      return false;
    }
  }
  async checkConnectivity() {
    try {
      const result = await runCommand2(`curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 --insecure ${this.webdavUrl}`, {}, this.verbosity);
      const statusCode = parseInt(result.stdout.trim(), 10);
      if (statusCode >= 200 && statusCode < 500) {
        success(`WebDAV server is reachable (status code: ${statusCode})`, this.verbosity);
        return true;
      } else {
        error(`WebDAV server returned error status: ${statusCode}`);
        return false;
      }
    } catch (error2) {
      error(`Failed to connect to WebDAV server: ${error2}`);
      return false;
    }
  }
  async uploadFile(filePath, targetPath, timeoutSeconds = 60) {
    try {
      const encodedPath = urlEncodePath(targetPath);
      const result = await runCommand2(`curl --insecure -m ${timeoutSeconds} -T "${filePath}" "${this.webdavUrl}/${encodedPath}"`, {}, this.verbosity);
      return { success: true, output: result.stdout };
    } catch (error2) {
      return { success: false, output: error2.message };
    }
  }
}

// src/core/uploader.js
class Uploader {
  constructor(webdavUrl, concurrentUploads, targetDir = "", verbosity = Verbosity.Normal) {
    this.webdavUrl = webdavUrl;
    this.concurrentUploads = concurrentUploads;
    this.targetDir = targetDir.trim().replace(/^\/+|\/+$/g, "");
    this.verbosity = verbosity;
    this.activeUploads = new Set;
    this.pendingFiles = [];
    this.completedFiles = 0;
    this.failedFiles = 0;
    this.totalFiles = 0;
    this.progressUpdateInterval = null;
    this.fileScanner = null;
    this.webdavService = new WebDAVService(webdavUrl, verbosity);
  }
  setFileScanner(scanner) {
    this.fileScanner = scanner;
  }
  async uploadFile(fileInfo) {
    this.activeUploads.add(fileInfo.relativePath);
    try {
      const dirPath = path3.dirname(fileInfo.relativePath);
      if (dirPath !== ".") {
        await this.webdavService.createDirectory(dirPath, this.targetDir);
      } else if (this.targetDir) {
        await this.webdavService.createDirectory("", this.targetDir);
      }
      const fileSize = fileInfo.size;
      const timeoutSeconds = Math.max(60, Math.ceil(fileSize / (100 * 1024)));
      const targetPath = this.targetDir ? `${this.targetDir}/${fileInfo.relativePath}` : fileInfo.relativePath;
      const encodedPath = urlEncodePath(targetPath);
      verbose(`Uploading: ${fileInfo.relativePath} (${(fileSize / 1024 / 1024).toFixed(2)} MB) to /${targetPath}`, this.verbosity);
      return new Promise((resolve) => {
        const curlProcess = createInteractiveProcess("curl", [
          "--insecure",
          "-m",
          String(timeoutSeconds),
          "-T",
          fileInfo.absolutePath,
          `${this.webdavUrl}/${encodedPath}`
        ], {}, this.verbosity);
        let stderr = "";
        curlProcess.stderr.on("data", (data) => {
          stderr += data.toString();
        });
        curlProcess.on("close", (code) => {
          if (code === 0) {
            if (this.fileScanner) {
              this.fileScanner.updateFileState(fileInfo.relativePath, fileInfo.checksum);
            }
            this.completedFiles++;
            verbose(`✓ Uploaded: ${fileInfo.relativePath}`, this.verbosity);
            this.activeUploads.delete(fileInfo.relativePath);
            resolve({
              success: true,
              filePath: fileInfo.relativePath
            });
          } else {
            this.failedFiles++;
            error(`✗ Failed to upload ${fileInfo.relativePath}: ${stderr}`);
            this.activeUploads.delete(fileInfo.relativePath);
            resolve({
              success: false,
              filePath: fileInfo.relativePath,
              error: stderr
            });
          }
          this.processNextFile();
        });
      });
    } catch (error2) {
      this.failedFiles++;
      this.activeUploads.delete(fileInfo.relativePath);
      error(`✗ Failed to upload ${fileInfo.relativePath}: ${error2.message}`);
      return {
        success: false,
        filePath: fileInfo.relativePath,
        error: error2.message
      };
    }
  }
  processNextFile() {
    if (this.pendingFiles.length === 0) {
      if (this.activeUploads.size === 0) {
        if (this.progressUpdateInterval) {
          clearInterval(this.progressUpdateInterval);
          this.progressUpdateInterval = null;
        }
      }
      return;
    }
    if (this.activeUploads.size < this.concurrentUploads) {
      const fileInfo = this.pendingFiles.shift();
      this.uploadFile(fileInfo);
    }
  }
  updateProgressBar() {
    const totalToProcess = this.totalFiles;
    const processed = this.completedFiles + this.failedFiles;
    const percentage = totalToProcess > 0 ? Math.floor(processed / totalToProcess * 100) : 0;
    const barWidth = 30;
    const completeWidth = Math.floor(percentage / 100 * barWidth);
    const bar = "█".repeat(completeWidth) + "░".repeat(barWidth - completeWidth);
    process.stdout.write(`\r[${bar}] ${percentage}% | ${processed}/${totalToProcess}`);
    if (processed === totalToProcess && totalToProcess > 0) {
      process.stdout.write(`
`);
      if (this.progressUpdateInterval) {
        clearInterval(this.progressUpdateInterval);
        this.progressUpdateInterval = null;
      }
    }
  }
  async startUpload(filesToUpload) {
    if (!this.webdavUrl) {
      error("WebDAV URL is not available. Setup may have failed.");
      return;
    }
    if (!await this.webdavService.checkConnectivity()) {
      return;
    }
    await this.webdavService.createDirectoryStructure(this.targetDir);
    if (filesToUpload.length === 0) {
      success("All files are up to date.", this.verbosity);
      return;
    }
    this.totalFiles = filesToUpload.length;
    this.completedFiles = 0;
    this.failedFiles = 0;
    this.pendingFiles = [...filesToUpload];
    this.activeUploads.clear();
    info(`Starting parallel upload with ${this.concurrentUploads} concurrent uploads...`, this.verbosity);
    this.updateProgressBar();
    this.progressUpdateInterval = setInterval(() => this.updateProgressBar(), 100);
    try {
      const initialBatchSize = Math.min(this.concurrentUploads, this.pendingFiles.length);
      for (let i = 0;i < initialBatchSize; i++) {
        this.processNextFile();
      }
      await new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (this.pendingFiles.length === 0 && this.activeUploads.size === 0) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 500);
      });
      if (this.fileScanner) {
        this.fileScanner.recordCompletion();
        await this.fileScanner.saveState();
      }
      if (this.failedFiles === 0) {
        always(chalk3.green(`
Upload completed successfully! All ${this.completedFiles} files uploaded.`));
      } else {
        always(chalk3.yellow(`
Upload completed with issues: ${this.completedFiles} succeeded, ${this.failedFiles} failed.`));
      }
    } catch (error2) {
      error(`
Upload process failed: ${error2}`);
      if (this.fileScanner) {
        await this.fileScanner.saveState();
      }
    } finally {
      if (this.progressUpdateInterval) {
        clearInterval(this.progressUpdateInterval);
        this.progressUpdateInterval = null;
      }
    }
  }
}

// internxt-sync.ts
var __filename2 = fileURLToPath(import.meta.url);
var __dirname2 = path4.dirname(__filename2);
if (!isBunEnvironment()) {
  console.log(chalk4.yellow("Note: For best performance, run this file with Bun instead of Node.js."));
  console.log(chalk4.yellow("If you're using Node.js, consider using the universal entry point (index.js) instead."));
}
async function main() {
  try {
    // Apply console patches early for emoji spacing
    patchConsole();
    
    // Parse command line arguments
    const args = process.argv.slice(2);
    const options = parseArguments(args);
    if (options.showHelp || !options.sourceDir) {
      showHelp();
      process.exit(options.showHelp ? 0 : 1);
    }
    const internxtCLI = new InternxtCLI(options.verbosity);
    const fileScanner = new FileScanner(options.sourceDir, options.verbosity);
    let webdavUrl = options.webdavUrl;
    if (!options.skipSetup) {
      info("Setting up Internxt...", options.verbosity);
      if (!await internxtCLI.setup()) {
        error("Setup failed. Cannot continue.");
        process.exit(1);
      }
      webdavUrl = webdavUrl || internxtCLI.getWebDAVUrl();
    } else {
      if (webdavUrl) {
        internxtCLI.setWebDAVUrl(webdavUrl);
        info(`Using provided WebDAV URL: ${webdavUrl}`, options.verbosity);
      } else {
        info("Checking for WebDAV URL...", options.verbosity);
        if (await internxtCLI.checkWebDAVEnabled()) {
          webdavUrl = internxtCLI.getWebDAVUrl();
          info(`Using detected WebDAV URL: ${webdavUrl}`, options.verbosity);
        } else {
          error("Could not detect WebDAV URL. Please enable WebDAV or provide --webdav-url");
          process.exit(1);
        }
      }
    }
    if (!webdavUrl) {
      error("WebDAV URL is not available. Cannot continue.");
      process.exit(1);
    }
    const concurrentUploads = getOptimalConcurrency(options.cores);
    const uploader = new Uploader(webdavUrl, concurrentUploads, options.targetDir, options.verbosity);
    uploader.setFileScanner(fileScanner);
    const scanResult = await fileScanner.scan();
    if (scanResult.filesToUpload.length === 0) {
      success("All files are up to date. Nothing to upload.", options.verbosity);
    } else {
      await uploader.startUpload(scanResult.filesToUpload);
    }
  } catch (error2) {
    error(`Fatal error: ${error2.message}`);
    console.error(error2);
    process.exit(1);
  }
}
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error2) => {
    error(`Fatal error: ${error2.message}`);
    console.error(error2);
    process.exit(1);
  });
}
var internxt_sync_default = main;
export {
  internxt_sync_default as default
};
