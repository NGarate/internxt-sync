#!/usr/bin/env bun
/**
 * Minimal prepare-dist script for webdav-backup
 * Only handles making the file executable and creating dist files
 */

import { join } from "path";
import { writeFile, readFile } from "fs/promises";
import { platform } from "os";

const outputDir = "./dist";
const outputFile = join(outputDir, "webdav-backup.js");

async function prepareDistribution() {
  console.log("Preparing distribution files...");
  
  try {
    // Get package.json for version info
    const packageJson = await Bun.file("./package.json").json();
    const version = packageJson.version;
    
    // Read the built file
    const builtContent = await readFile(outputFile, "utf-8");
    
    // Add shebang and version info
    const executableContent = `#!/usr/bin/env bun
/**
 * webdav-backup v${version}
 * A simple, fast CLI for backing up files to WebDAV servers
 * https://github.com/ngarate/webdav-backup
 */

${builtContent}`;
    
    // Write the final executable file
    await writeFile(outputFile, executableContent);
    console.log(`Added shebang and version info to ${outputFile}`);
    
    // Make it executable on Unix-like systems
    if (platform() !== 'win32') {
      Bun.spawnSync(["chmod", "+x", outputFile]);
      console.log(`Set executable permissions for ${outputFile}`);
    }
    
    // Create a minimal package.json for the dist folder
    const distPackageJson = {
      name: "webdav-backup",
      version: version,
      description: packageJson.description,
      type: "module",
      main: "webdav-backup.js",
      bin: {
        "webdav-backup": "./webdav-backup.js"
      },
      dependencies: packageJson.dependencies
    };
    
    await writeFile(
      join(outputDir, "package.json"), 
      JSON.stringify(distPackageJson, null, 2)
    );
    console.log("Created dist/package.json");
    
    // Create a simple README for the dist folder
    const readmeContent = `# WebDAV Backup CLI

Version: ${version}

A simple, fast CLI for backing up files to WebDAV servers.

## Usage

\`\`\`
webdav-backup <source-dir> [options]
\`\`\`

### Options

- \`--cores=<number>\`   Number of concurrent uploads (default: 2/3 of CPU cores)
- \`--target=<path>\`    Target directory on the WebDAV server (default: root directory)
- \`--quiet\`            Show minimal output (only errors and the progress bar)
- \`--verbose\`          Show detailed output including per-file operations
- \`--force\`            Force upload all files regardless of whether they've changed
- \`--webdav-url=<url>\` WebDAV server URL (required)
- \`--help, -h\`         Show help message
- \`--version, -v\`      Show version information
\`\`\``;
    
    await writeFile(join(outputDir, "README.md"), readmeContent);
    console.log("Created dist/README.md");
    
  } catch (error) {
    console.error("Failed preparing distribution:", error);
    process.exit(1);
  }
}

// Execute the script
prepareDistribution().catch(err => {
  console.error("Error:", err);
  process.exit(1);
}); 