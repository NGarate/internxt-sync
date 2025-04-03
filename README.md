# Internxt Sync

A high-performance command-line tool for synchronizing and uploading files to Internxt Drive, optimized for Bun with Node.js compatibility.

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

- **Recommended**: [Bun](https://bun.sh/) runtime (for optimal performance)
- **Alternative**: Node.js 14.16.0+
- Internxt account (free or paid)

## Installation

### Preferred: Install with Bun (Recommended)

```bash
# Install globally with Bun (recommended for best performance)
bun install -g internxt-sync
```

### Alternative: Install with npm

```bash
# Install globally with npm if Bun is not available
npm install -g internxt-sync
```

## Usage

### Recommended Usage with Bun

```bash
# If installed globally with Bun (recommended)
internxt-sync <source-dir> [options]

# Or run the TypeScript file directly (fastest)
bun internxt-sync.ts <source-dir> [options]
```

### Alternative Usage with Node.js

```bash
# If installed globally with npm
internxt-sync <source-dir> [options]

# Or run with Node.js directly
node index.js <source-dir> [options]
```

When run:

- The tool automatically detects your runtime environment (Bun or Node.js)
- With Bun: Executes the TypeScript file directly for maximum performance
- With Node.js: Uses the pre-compiled JavaScript version
- If the JavaScript file doesn't exist, it will try to compile it automatically if Bun is available
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
# Upload files with default settings
bun internxt-sync.ts /path/to/files

# Upload files with 4 concurrent uploads
bun internxt-sync.ts /path/to/files --cores=4

# Upload files to a specific target directory
bun internxt-sync.ts /path/to/files --target=backup/daily

# Upload with minimal output
bun internxt-sync.ts /path/to/files --quiet

# Skip setup but auto-detect WebDAV URL
bun internxt-sync.ts /path/to/files --skip-setup

# Skip setup and use a specific WebDAV URL
bun internxt-sync.ts /path/to/files --skip-setup --webdav-url=http://webdav.local.internxt.com:3005
```

## How It Works

1. The tool detects your runtime environment (Bun or Node.js)
2. It selects the appropriate version to run based on the detected environment:
   - **With Bun**: Executes the TypeScript code directly for maximum performance
   - **With Node.js**: Uses the pre-compiled JavaScript version as fallback
3. It checks if Internxt CLI is installed and installs it if necessary (unless `--skip-setup` is used)
   - Will try to install with Bun first if available, falling back to npm
4. It verifies if you're logged into your Internxt account and assists with login if needed (unless `--skip-setup` is used)
5. It ensures WebDAV is enabled for your Internxt Drive and detects the WebDAV URL
6. The tool scans the source directory for files and calculates checksums
7. It uploads files that have changed since the last run
8. Progress is displayed with a visual progress bar

With `--skip-setup`, the tool will still try to detect the WebDAV URL from the Internxt CLI without going through the full setup process, making subsequent runs faster.

## Development

```bash
# Clone the repository
git clone https://github.com/ngarate/internxt-sync.git
cd internxt-sync

# Install dependencies with Bun (recommended)
bun install

# Run tests with Bun
bun test

# Build with Bun (fastest)
bun run build
```

## Runtime Environment

Internxt Sync is designed with a Bun-first approach for maximum performance:

### For Users

- **Recommended: Bun Runtime** - The tool will use Bun for maximum performance, running the TypeScript code directly.
- **Fallback: Node.js Runtime** - If Bun is not available, the tool will automatically use the pre-compiled JavaScript version.
- **Automatic Detection** - No configuration needed; the tool detects the available runtime.

### For Developers

- **Development**: Use Bun for the best development experience with faster builds and tests.
- **Testing**: Tests are written for Bun's test runner.
- **Building**: The build process uses Bun if available, with clear instructions if it's not.

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