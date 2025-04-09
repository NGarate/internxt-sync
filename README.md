# WebDAV Backup

A simple, fast, and efficient tool for backing up files to a WebDAV server.

## Features

- Efficient file change detection using checksums
- Parallel file uploads with configurable concurrency
- Progress visualization
- Directory structure preservation
- Target directory specification
- Cross-platform support (Windows, macOS, Linux)
- Native Bun performance optimizations

## Requirements

- [Bun](https://bun.sh/) runtime ≥ 1.0.0
- A WebDAV server URL

## Installation

You can install WebDAV Backup globally using Bun:

```bash
bun install -g webdav-backup
```

## Usage

```bash
webdav-backup <source-directory> --webdav-url=https://your-webdav-server.com/path
```

### Options

- `--cores=<number>` - Number of concurrent uploads (default: 2/3 of CPU cores)
- `--target=<path>` - Target directory on the WebDAV server (default: root directory)
- `--quiet` - Show minimal output (only errors and the progress bar)
- `--verbose` - Show detailed output including per-file operations
- `--force` - Force upload all files regardless of whether they've changed
- `--webdav-url=<url>` - WebDAV server URL (required)
- `--help, -h` - Show help message
- `--version, -v` - Show version information

### Examples

```bash
# Basic usage
webdav-backup /path/to/files --webdav-url=https://example.com/webdav

# With 4 concurrent uploads
webdav-backup /path/to/files --cores=4 --webdav-url=https://example.com/webdav

# To a specific target directory
webdav-backup /path/to/files --target=backup/daily --webdav-url=https://example.com/webdav

# With minimal output
webdav-backup /path/to/files --quiet --webdav-url=https://example.com/webdav

# Force upload all files
webdav-backup /path/to/files --force --webdav-url=https://example.com/webdav
```

## How It Works

1. The tool scans the source directory for files and calculates checksums
2. It uploads files that have changed since the last run
3. Directory structures are created automatically on the WebDAV server
4. Progress is displayed with a visual progress bar
5. Optimized for Bun's performance capabilities

## For Developers

If you want to contribute to the project or use it for development:

```bash
# Clone the repository
git clone https://github.com/yourusername/webdav-backup.git
cd webdav-backup

# Install dependencies
bun install

# Run the tool during development
bun dev

# Install locally for testing
bun link
```

## Troubleshooting

### Global Installation Issues

If you encounter issues with the global installation, try one of these alternative methods:

1. Install from the source directory:
   ```bash
   git clone https://github.com/yourusername/webdav-backup.git
   cd webdav-backup
   bun install -g .
   ```

2. Use `bunx` to run without installing:
   ```bash
   bunx webdav-backup --help
   ```

3. On Ubuntu/Linux, you might need to set up your PATH correctly:
   ```bash
   # Add this to your ~/.bashrc or ~/.zshrc
   export BUN_INSTALL="$HOME/.bun"
   export PATH="$BUN_INSTALL/bin:$PATH"
   ```

### Running in Windows

Bun has full Windows support. If you encounter any issues:

1. Make sure you have Bun installed (`bun --version`)
2. Try running with full paths: `bun /path/to/webdav-backup <args>`

## Roadmap

Future enhancements planned for this project include:

1. **Command Structure Improvement**
   - Add subcommands like `upload`, `sync`, `config` for better organization
   - Example: `webdav-backup upload --source /path --target https://example.com`

2. **Advanced Filtering**
   - Support for `--exclude` patterns to skip specific files/directories
   - Support for `--include` patterns to explicitly include files

3. **Error Handling**
   - Add `--retries` option for automatic retry on failed uploads
   - Improved error reporting and recovery mechanisms

4. **Configuration File Support**
   - Support for JSON/YAML config files with `--config` option
   - Save and reuse connection settings

5. **Authentication Improvements**
   - Better credential handling with secure storage
   - Support for OAuth and other authentication methods

6. **Sync Capabilities**
   - Two-way synchronization between local and remote directories
   - Delete remote files that don't exist locally with `--delete-extraneous`

7. **Performance Optimizations**
   - Improved concurrency model for large file sets
   - Better memory usage for extremely large directories

8. **User Experience**
   - Interactive mode with prompts for missing options
   - Improved progress visualization

## License

MIT 