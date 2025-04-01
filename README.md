# Internxt Sync

A command-line tool for synchronizing and uploading files to Internxt Drive. This tool provides a simple and efficient way to upload multiple files with parallel processing capabilities.

## Features

- Automatic Internxt CLI installation and setup
- WebDAV enablement for Internxt Drive
- Parallel file uploads with configurable concurrency
- Resumable uploads with state tracking
- Progress visualization
- Directory structure preservation
- Target directory specification
- Automatic WebDAV URL detection
- Runtime environment detection (Bun or Node.js)
- Universal entry point that works in any environment
- Cross-platform support (Windows, macOS, Linux)

## Requirements

- [Bun](https://bun.sh/) runtime (recommended for best performance)
- Node.js environment (alternative)
- Internxt account (free or paid)

## Installation

### Option 1: Install globally (recommended)

```bash
# Install with Bun (recommended for best performance)
bun install -g internxt-sync

# Or with npm if Bun is not available
npm install -g internxt-sync

# Then use the tool from anywhere
internxt-sync <source-dir> [options]
```

### Option 2: Clone and use locally

```bash
# Clone this repository
git clone <repository-url>
cd internxt-sync

# Install dependencies with Bun (recommended)
bun install

# Or with npm if Bun is not available
npm install

# Run locally with Bun (recommended)
bun index.js <source-dir> [options]

# Or with Node.js
node index.js <source-dir> [options]
```

## Usage

### Simple Usage (Works on Any Platform)

The tool automatically detects your runtime environment and adapts accordingly:

```bash
# If installed globally (recommended)
internxt-sync <source-dir> [options]

# If using locally with Bun (recommended)
bun index.js <source-dir> [options]

# Alternative: If using locally with Node.js
node index.js <source-dir> [options]

# Alternative: Using npm scripts
npm start -- <source-dir> [options]
```

When run:
- The tool automatically detects your platform (Windows, macOS, Linux)
- If Bun is detected, it will run the TypeScript file directly for better performance
- If Node.js is detected, it will use the compiled JavaScript file
- If the JavaScript file doesn't exist, it will try to compile it automatically
- All platform-specific operations are handled internally

### Options

- `--cores=<number>` - Number of concurrent uploads (default: 2/3 of CPU cores)
- `--target=<path>` - Target directory on Internxt (default: root directory)
- `--quiet` - Show minimal output (only errors and the progress bar)
- `--verbose` - Show detailed output including per-file operations
- `--skip-setup` - Skip the full setup process (still checks WebDAV status)
- `--webdav-url=<url>` - Use a specific WebDAV URL (optional, can be auto-detected)
- `--help` - Show help message

### Examples

```bash
# Global installation (recommended usage):

# Upload files with default settings
internxt-sync /path/to/files

# Upload files with 4 concurrent uploads
internxt-sync /path/to/files --cores=4

# Upload files to a specific target directory
internxt-sync /path/to/files --target=backup/daily

# Upload with minimal output
internxt-sync /path/to/files --quiet

# Skip setup but auto-detect WebDAV URL
internxt-sync /path/to/files --skip-setup

# Skip setup and use a specific WebDAV URL
internxt-sync /path/to/files --skip-setup --webdav-url=http://webdav.local.internxt.com:3005

# Local installation alternatives:

# With Bun (for better performance)
bun index.js /path/to/files --verbose

# With Node.js
node index.js /path/to/files --cores=4
```

## How It Works

1. The tool detects your operating system and runtime environment
2. It selects the appropriate version to run based on the detected environment:
   - With Bun: Executes the TypeScript code directly for better performance
   - With Node.js: Uses the pre-compiled JavaScript version
3. It checks if Internxt CLI is installed and installs it if necessary (unless `--skip-setup` is used)
   - Will try to install with Bun first if available, falling back to npm
4. It verifies if you're logged into your Internxt account and assists with login if needed (unless `--skip-setup` is used)
5. It ensures WebDAV is enabled for your Internxt Drive and detects the WebDAV URL
6. The tool scans the source directory for files and calculates checksums
7. It uploads files that have changed since the last run
8. Progress is displayed with a visual progress bar

With `--skip-setup`, the tool will still try to detect the WebDAV URL from the Internxt CLI without going through the full setup process, making subsequent runs faster.

## Advanced Usage

The tool supports different execution methods for advanced users:

```bash
# Run the TypeScript file directly with Bun (fastest)
bun internxt-sync.ts <source-dir> [options]

# Build the project
bun run build
# or with npm
npm run build

# Run the compiled JavaScript file
bun src/internxt-sync.js <source-dir> [options]
# or with Node.js
node src/internxt-sync.js <source-dir> [options]

# Running tests with Bun
bun test
# or specific tests
bun test src/test/webdav-service.test.js
```

## License

MIT 