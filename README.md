# WebDAV Backup

A high-performance command-line tool for synchronizing and uploading files to any WebDAV server, optimized for Node.js with enhanced performance when using Bun.

## Features

- Parallel file uploads with configurable concurrency
- Resumable uploads with state tracking
- Progress visualization
- Directory structure preservation
- Target directory specification
- Cross-platform support (Windows, macOS, Linux)
- Intelligent runtime detection for optimal performance with Bun or Node.js

## Requirements

- Node.js 18.0.0+
- A WebDAV server URL
- (Optional) [Bun](https://bun.sh/) runtime for enhanced development experience and performance

## Installation

### Install with npm

```bash
# Install globally with npm
npm install -g webdav-backup
```

### Alternative: Install with Bun

```bash
# Install globally with Bun (for Bun users)
bun install -g webdav-backup
```

## Usage

```bash
# Basic usage
webdav-backup <source-dir> --webdav-url=<url> [options]
```

### Options

- `--cores=<number>` - Number of concurrent uploads (default: 2/3 of CPU cores)
- `--target=<path>` - Target directory on the WebDAV server (default: root directory)
- `--quiet` - Show minimal output (only errors and the progress bar)
- `--verbose` - Show detailed output including per-file operations
- `--webdav-url=<url>` - WebDAV server URL (required)
- `--help` - Show help message

### Examples

```bash
# Upload files to a WebDAV server
webdav-backup /path/to/files --webdav-url=https://example.com/webdav

# Upload files with 4 concurrent uploads
webdav-backup /path/to/files --cores=4 --webdav-url=https://example.com/webdav

# Upload files to a specific target directory
webdav-backup /path/to/files --target=backup/daily --webdav-url=https://example.com/webdav

# Upload with minimal output
webdav-backup /path/to/files --quiet --webdav-url=https://example.com/webdav

# Upload to a local WebDAV server
webdav-backup /path/to/files --webdav-url=http://localhost:8080/webdav
```

## How It Works

1. The tool scans the source directory for files and calculates checksums
2. It uploads files that have changed since the last run
3. Directory structures are created automatically on the WebDAV server
4. Progress is displayed with a visual progress bar
5. The tool automatically detects whether to use Bun or Node.js runtime based on your environment

## Runtime Selection

WebDAV Backup intelligently selects the optimal runtime:

- If you execute with `bun webdav-backup`, it uses Bun's optimized pathways
- If you execute with `node` or without specifying the runtime, it auto-detects based on:
  - The presence of Bun in your environment
  - The package manager used for installation (detects npm, yarn, pnpm, or bun lockfiles)
  - Installation location patterns

This ensures you get the best performance possible regardless of how you installed or run the tool.

## For Developers

If you want to contribute to the project or use it for development:

```bash
# Clone the repository
git clone https://github.com/yourusername/webdav-backup.git
cd webdav-backup

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

Bun's built-in test runner is configured to automatically:
- Load test setup files
- Mock external dependencies
- Find and execute all `*.test.ts` files

For more details on Bun's test runner, see the [official documentation](https://bun.sh/docs/cli/test).

## Features

- Efficient file change detection using checksums
- Concurrent uploads
- Progress tracking
- Clear console output with emoji indicators
- WebDAV directory structure management

## License

MIT 