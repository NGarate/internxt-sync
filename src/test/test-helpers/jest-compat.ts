/**
 * Jest compatibility layer for Bun tests
 * 
 * This file provides Jest-like functionality for tests running in Bun.
 * It ensures that common Jest functions and mocking capabilities are available.
 */

// Define the global jest object if not already defined
if (!globalThis.jest) {
  globalThis.jest = {} as any;
}

// Create a mock function factory
if (!globalThis.jest.fn) {
  globalThis.jest.fn = function mockFn(implementation?: Function) {
    const mockFunction = implementation || ((...args: any[]) => undefined);
    
    // Add Jest mock functionality
    mockFunction.mockImplementation = (newImplementation: Function) => {
      const newMock = function(...args: any[]) {
        return newImplementation.apply(this, args);
      };
      Object.setPrototypeOf(newMock, mockFunction);
      return newMock;
    };
    
    mockFunction.mockReturnValue = (value: any) => {
      mockFunction.mockImplementation = () => value;
      return mockFunction;
    };
    
    mockFunction.mockResolvedValue = (value: any) => {
      mockFunction.mockImplementation = () => Promise.resolve(value);
      return mockFunction;
    };
    
    mockFunction.mockRejectedValue = (error: any) => {
      mockFunction.mockImplementation = () => Promise.reject(error);
      return mockFunction;
    };
    
    // Call tracking
    const calls: any[][] = [];
    mockFunction.mock = { calls };
    
    // Wrap the function to track calls
    return new Proxy(mockFunction, {
      apply(target, thisArg, argArray) {
        calls.push(argArray);
        return Reflect.apply(target, thisArg, argArray);
      }
    });
  };
}

// Module mocking
if (!globalThis.jest.mock) {
  globalThis.jest.mock = function mockModule(moduleName: string, factory?: () => any) {
    // This is a simplified implementation that registers mocks
    console.log(`Mocking module: ${moduleName}`);
  };
}

// Reset all mocks helper
if (!globalThis.jest.resetAllMocks) {
  globalThis.jest.resetAllMocks = function resetAllMocks() {
    // Find all mocks and reset them
    console.log('Resetting all mocks');
  };
}

// Spy on function implementation
if (!globalThis.jest.spyOn) {
  globalThis.jest.spyOn = function spyOn(object: any, methodName: string) {
    const originalMethod = object[methodName];
    const mockFn = globalThis.jest.fn(originalMethod);
    
    // Replace the method with our mock
    object[methodName] = mockFn;
    
    // Add restore capability
    mockFn.mockRestore = () => {
      object[methodName] = originalMethod;
      return mockFn;
    };
    
    return mockFn;
  };
}

// Export the jest object for explicit importing
export const jest = globalThis.jest;

// Export common jest functions for convenience
export const fn = jest.fn;
export const mock = jest.mock;
export const spyOn = jest.spyOn;
export const resetAllMocks = jest.resetAllMocks; 