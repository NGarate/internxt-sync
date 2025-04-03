/**
 * Mock implementation for webdav
 */

// Simple WebDAV client implementation with Promise-based methods
const createClient = (options = {}) => {
  return {
    // File operations
    putFileContents: async () => true,
    getFileContents: async () => Buffer.from('mock file content'),
    deleteFile: async () => true,
    moveFile: async () => true,
    copyFile: async () => true,
    
    // Directory operations
    createDirectory: async () => true,
    deleteDirectory: async () => true,
    getDirectoryContents: async () => ([]),
    
    // Stat operations
    stat: async () => ({
      filename: 'mock-file',
      basename: 'mock-file',
      lastmod: new Date().toISOString(),
      size: 0,
      type: 'file'
    }),
    
    // Utility operations
    exists: async () => false,
    customRequest: async () => ({ status: 200, data: {} }),
    
    // Additional operations
    getFileDownloadLink: async () => 'https://mock-download-link',
    getFileUploadLink: async () => 'https://mock-upload-link',
    setHeaders: () => {},
    getHeaders: () => ({}),
    _request: async () => ({}),
  };
};

// Export the createClient function as the default export
export default {
  createClient
};

// Also export named exports for compatibility
export { createClient }; 