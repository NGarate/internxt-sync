# Internxt Sync

A high-performance command-line tool for synchronizing and uploading files to Internxt Drive, optimized for Node.js with enhanced performance when using Bun.

## Features

- Automatic Internxt CLI installation and setup
- WebDAV enablement for Internxt Drive
- Parallel file uploads with configurable concurrency
- Resumable uploads with state tracking
- Progress visualization
- Directory structure preservation
- Target directory specification
- Automatic WebDAV URL detection
- Cross-platform support (Windows, macOS, Linux)

## Requirements

- Node.js 14.16.0+
- Internxt account (free or paid)
- (Optional) [Bun](https://bun.sh/) runtime for enhanced development experience

## Installation

### Install with npm (Recommended for most users)

```bash
# Install globally with npm
npm install -g internxt-sync
```

### Alternative: Install with Bun

```bash
# Install globally with Bun (for Bun users)
bun install -g internxt-sync
```

## Usage

```bash
# Basic usage
internxt-sync <source-dir> [options]
```

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
```

## How It Works

1. The tool checks if Internxt CLI is installed and installs it if necessary (unless `--skip-setup` is used)
2. It verifies if you're logged into your Internxt account and assists with login if needed (unless `--skip-setup` is used)
3. It ensures WebDAV is enabled for your Internxt Drive and detects the WebDAV URL
4. The tool scans the source directory for files and calculates checksums
5. It uploads files that have changed since the last run
6. Progress is displayed with a visual progress bar

With `--skip-setup`, the tool will still try to detect the WebDAV URL from the Internxt CLI without going through the full setup process, making subsequent runs faster.

## For Developers

If you want to contribute to the project or use it for development:

```bash
# Clone the repository
git clone https://github.com/ngarate/internxt-sync.git
cd internxt-sync

# Install dependencies with Bun (recommended for development)
bun install

# Run tests
bun run test

# Build the project
bun run build
```

## Testing

The project includes a comprehensive test suite:

```bash
# Run all tests
bun run test
```

Bun's built-in test runner is configured in `bunfig.toml` to automatically:
- Load test setup files
- Mock external dependencies
- Find and execute all `*.test.ts` files

For more details on Bun's test runner, see the [official documentation](https://bun.sh/docs/cli/test).

## License

MIT 

# Internxt WebDAV Uploader

A command-line tool to synchronize and upload files to Internxt Drive using WebDAV protocol.

## Using with Bun

This project is designed to work with Bun, a fast JavaScript runtime and toolkit. Bun offers several advantages:

- Direct TypeScript execution without transpilation
- Faster dependency installation
- Bundled test runner
- Simplified build process

### Requirements

- [Bun](https://bun.sh/) version 1.0.0 or higher

### Installation

```bash
# Install Bun (if not already installed)
curl -fsSL https://bun.sh/install | bash

# Install dependencies
bun install
```

### Development Commands

```bash
# Run in development mode
bun run dev

# Build for production
bun run build

# Run tests
bun run test

# Clean up build artifacts
bun scripts/clean.ts

# Remove JavaScript files (after TypeScript migration)
bun scripts/cleanup-js.ts
```

## Features

- Automatic WebDAV URL detection
- File change detection using checksums
- Concurrent uploads
- Progress tracking
- Clear console output with emoji indicators

## Usage

```bash
bun internxt-sync.ts <sourceDir> [options]
```

### Options

- `--webdav-url <url>`: Specify WebDAV server URL
- `--target-dir <path>`: Specify target directory on WebDAV server
- `--cores <number>`: Number of concurrent uploads
- `--verbose`: Show detailed logging
- `--quiet`: Show minimal output
- `--skip-setup`: Skip WebDAV connectivity check
- `--help`: Show help message

## License

MIT 