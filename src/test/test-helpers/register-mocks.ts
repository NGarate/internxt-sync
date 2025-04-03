/**
 * Register mocks for testing with Bun's native mock system
 */

import { mock } from 'bun:test';
import chalkMock, { chalkMock as namedChalkMock } from '../mocks/chalk-mock';
import webdavMock from '../mocks/webdav-mock';

// Register the chalk module mock
mock.module('chalk', () => {
  return {
    default: chalkMock,
    ...namedChalkMock
  };
});

// Register the webdav module mock
mock.module('webdav', () => webdavMock);

// Export the mocks for direct usage in tests
export { chalkMock, webdavMock }; 