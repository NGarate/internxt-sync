/**
 * File scanner related interfaces and types
 */

/**
 * Represents information about a file during scanning
 */
export interface FileInfo {
  relativePath: string;
  absolutePath: string;
  size: number;
  checksum: string;
  hasChanged: boolean | null;
}

/**
 * Results from a file system scan operation
 */
export interface ScanResult {
  allFiles: FileInfo[];
  filesToUpload: FileInfo[];
  totalSizeBytes: number;
  totalSizeMB: string;
}

/**
 * Structure for storing file upload state
 */
export interface UploadState {
  files: Record<string, string>; // Map of file paths to checksums
  lastRun: string; // ISO date string of last successful run
} 