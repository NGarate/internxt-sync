/**
 * Test Setup File
 * 
 * This file is responsible for setting up the test environment.
 * It is run before any tests are executed.
 */

// Import the module mapper to configure mock implementations
import './module-mapper';
import { beforeEach, afterEach } from 'bun:test';
import { safeModuleMock } from './bun-test-helpers';

// Suppress console output during tests to keep test output clean
const originalConsole = { ...console };

// Store original console methods
const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;
const originalInfo = console.info;
const originalDebug = console.debug;

// Override console methods in test environment
if (process.env.NODE_ENV === 'test') {
  console.log = () => {};
  console.error = () => {};
  console.warn = () => {};
  console.info = () => {};
  console.debug = () => {};
}

// Expose a way to restore the original console
export function restoreConsole() {
  console.log = originalLog;
  console.error = originalError;
  console.warn = originalWarn;
  console.info = originalInfo;
  console.debug = originalDebug;
}

// Expose a function to enable logging temporarily
export function enableLogging(fn: () => void) {
  restoreConsole();
  try {
    fn();
  } finally {
    // If in test environment, disable logging again
    if (process.env.NODE_ENV === 'test') {
      console.log = () => {};
      console.error = () => {};
      console.warn = () => {};
      console.info = () => {};
      console.debug = () => {};
    }
  }
}

// Store original module functions we want to mock
const originalModuleFunctions: Record<string, Record<string, Function>> = {};

/**
 * Safely mocks a function in a module without causing "readonly property" errors
 * 
 * Example usage: 
 * safeModuleMock(logger, 'verbose', mockLoggerFn);
 * 
 * @param module The module object containing the function to mock
 * @param functionName The name of the function to mock
 * @param mockImplementation The mock implementation to use
 */
export function safeModuleMock(
  module: Record<string, any>,
  functionName: string,
  mockImplementation: Function
): void {
  const moduleId = Object.prototype.toString.call(module);
  
  // Store the original function if not already stored
  if (!originalModuleFunctions[moduleId]) {
    originalModuleFunctions[moduleId] = {};
  }
  
  if (!originalModuleFunctions[moduleId][functionName]) {
    originalModuleFunctions[moduleId][functionName] = module[functionName];
    
    // Use Object.defineProperty to override even readonly properties
    Object.defineProperty(module, functionName, {
      configurable: true,
      writable: true,
      value: mockImplementation
    });
  } else {
    // If already stored, just update the value
    module[functionName] = mockImplementation;
  }
}

/**
 * Restores all mocked module functions to their original implementations
 */
export function restoreAllModuleMocks(): void {
  for (const moduleId in originalModuleFunctions) {
    for (const functionName in originalModuleFunctions[moduleId]) {
      const module = Object.keys(originalModuleFunctions).find(
        key => key === moduleId
      );
      if (module) {
        // Restore original function
        Object.defineProperty(globalThis[module], functionName, {
          configurable: true,
          writable: true,
          value: originalModuleFunctions[moduleId][functionName]
        });
      }
    }
  }
  
  // Clear stored originals
  Object.keys(originalModuleFunctions).forEach(key => {
    delete originalModuleFunctions[key];
  });
}

// Clean up mocks after each test
afterEach(() => {
  // The restoreAllModuleMocks function is now handled in bun-test-helpers.ts
}); 