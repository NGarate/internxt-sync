/**
 * Bun Test Loader
 * 
 * This loader is used by Bun's test runner to handle test files.
 * It ensures proper module loading and test configuration.
 */

import { BunPlugin } from "bun";

/**
 * Bun test loader plugin
 * 
 * This plugin is used to load test files and handle imports
 * without needing global overrides or hacks.
 */
export default {
  name: "bun-test-loader",
  setup(build) {
    // Define test utils path for easy imports
    build.onResolve({ filter: /^@test-utils$/ }, () => {
      return { path: import.meta.dir + "/test-utils.ts" };
    });
    
    // Add direct paths to mock implementations
    build.onResolve({ filter: /^@mocks\/event-emitter$/ }, () => {
      return { path: import.meta.dir + "/mocks/event-emitter-mock.ts" };
    });
    
    build.onResolve({ filter: /^@mocks\/promise$/ }, () => {
      return { path: import.meta.dir + "/mocks/promise-mock.ts" };
    });
    
    build.onResolve({ filter: /^@mocks\/function$/ }, () => {
      return { path: import.meta.dir + "/mocks/function-mock.ts" };
    });
    
    // Add module mapper for external dependencies
    build.onResolve({ filter: /^@module-mapper$/ }, () => {
      return { path: import.meta.dir + "/module-mapper.ts" };
    });
    
    // Log any test file load errors
    build.onLoad({ filter: /\.test\.(ts|tsx)$/ }, (args) => {
      console.debug(`Loading test file: ${args.path}`);
      return undefined; // Let Bun handle the actual loading
    });
  },
} satisfies BunPlugin; 