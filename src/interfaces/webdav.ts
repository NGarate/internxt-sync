/**
 * WebDAV related interfaces
 */

export interface WebDAVConnectivityOptions {
  url: string;
  verbosity?: number;
}

export interface WebDAVServiceOptions {
  url: string;
  verbosity?: number;
}

export interface WebDAVClientOptions {
  url: string;
  username?: string;
  password?: string;
}

export interface UploadResult {
  success: boolean;
  filePath: string;
  output?: string;
}

export interface DirectoryResult {
  success: boolean;
  path: string;
  output?: string;
}
