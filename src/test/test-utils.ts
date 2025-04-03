import { WebDAVConnectivityOptions, WebDAVServiceOptions, WebDAVClientOptions, UploadResult, DirectoryResult } from '../interfaces/webdav.js';
/**
 * Test Utilities
 * 
 * This file provides common test utilities for the Internxt WebDAV Uploader project.
 */

import { spyOn as bunSpyOn } from 'bun:test';

/**
 * Creates a spy on an object's method that can be used to track calls and mock behavior
 * 
 * @param {object|Function} object - The object or constructor function containing the method
 * @param {string} method - The name of the method to spy on
 * @returns {object} A spy object with mock control methods
 */
export function spyOn(object, method) {
  return bunSpyOn(object, method);
}

/**
 * Creates a mock promise result for tests
 * Use this instead of directly using Promise.resolve() in test mocks
 * 
 * @param {any} value - The value to resolve the promise with
 * @returns {Promise<any>} A promise that resolves with the given value
 */
export function mockPromiseResult(value) {
  return new Promise(resolve => resolve(value));
}

/**
 * Creates a mock promise rejection for tests
 * Use this instead of directly using Promise.reject() in test mocks
 * 
 * @param {Error} error - The error to reject the promise with
 * @returns {Promise<never>} A promise that rejects with the given error
 */
export function mockPromiseRejection(error) {
  return new Promise((_, reject) => reject(error));
}

/**
 * Creates a mock object with all the properties/methods of an EventEmitter
 * 
 * @returns {object} A mock event emitter
 */
export function createMockEventEmitter() {
  const emitter = {
    _events: {},
    _eventsCount: 0,
    _maxListeners: undefined,
    on: () => emitter,
    once: () => emitter,
    emit: () => true,
    addListener: () => emitter,
    removeListener: () => emitter,
    setMaxListeners: () => emitter,
    getMaxListeners: () => 10,
    listeners: () => [],
    rawListeners: () => [],
    listenerCount: () => 0,
    eventNames: () => [],
    prependListener: () => emitter,
    prependOnceListener: () => emitter,
    off: () => emitter,
    removeAllListeners: () => emitter
  };
  
  // Add Symbol.for('nodejs.util.inspect.custom') to avoid serialization issues
  emitter[Symbol.for('nodejs.util.inspect.custom')] = () => 'MockEventEmitter';
  
  return emitter;
}

/**
 * Creates a more complex mock process for testing
 * 
 * @returns {object} A mock child process
 */
export function createMockProcess() {
  const stdin = createMockEventEmitter();
  stdin.write = () => true;
  stdin.end = () => {};
  
  const stdout = createMockEventEmitter();
  const stderr = createMockEventEmitter();
  
  const proc = createMockEventEmitter();
  proc.stdin = stdin;
  proc.stdout = stdout;
  proc.stderr = stderr;
  proc.kill = () => true;
  proc.pid = 12345;
  
  return proc;
} 