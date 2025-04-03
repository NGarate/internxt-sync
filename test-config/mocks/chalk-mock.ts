/**
 * Mock implementation for chalk
 */

// Simple chalk mock for testing
// Creates a mock function that returns itself to allow chaining

function createColorFunction() {
  const colorFunc = (text: string) => text;
  
  // Add chainable style methods
  colorFunc.bold = colorFunc;
  colorFunc.italic = colorFunc;
  colorFunc.underline = colorFunc;
  colorFunc.dim = colorFunc;
  
  // Add other color methods
  colorFunc.red = colorFunc;
  colorFunc.green = colorFunc;
  colorFunc.yellow = colorFunc;
  colorFunc.blue = colorFunc;
  colorFunc.magenta = colorFunc;
  colorFunc.cyan = colorFunc;
  colorFunc.white = colorFunc;
  colorFunc.gray = colorFunc;
  colorFunc.grey = colorFunc;
  
  // Add background colors
  colorFunc.bgRed = colorFunc;
  colorFunc.bgGreen = colorFunc;
  colorFunc.bgYellow = colorFunc;
  colorFunc.bgBlue = colorFunc;
  colorFunc.bgMagenta = colorFunc;
  colorFunc.bgCyan = colorFunc;
  colorFunc.bgWhite = colorFunc;
  
  return colorFunc;
}

// Create the main chalk object with basic color functions
const chalkMock = createColorFunction();

// Add methods for each color and style
chalkMock.red = createColorFunction();
chalkMock.green = createColorFunction();
chalkMock.yellow = createColorFunction();
chalkMock.blue = createColorFunction();
chalkMock.magenta = createColorFunction();
chalkMock.cyan = createColorFunction();
chalkMock.white = createColorFunction();
chalkMock.gray = createColorFunction();
chalkMock.grey = createColorFunction();

chalkMock.bold = createColorFunction();
chalkMock.italic = createColorFunction();
chalkMock.underline = createColorFunction();
chalkMock.dim = createColorFunction();

// Background colors
chalkMock.bgRed = createColorFunction();
chalkMock.bgGreen = createColorFunction();
chalkMock.bgYellow = createColorFunction();
chalkMock.bgBlue = createColorFunction();
chalkMock.bgMagenta = createColorFunction();
chalkMock.bgCyan = createColorFunction();
chalkMock.bgWhite = createColorFunction();

// Add visibility property
chalkMock.visible = createColorFunction();

// Export both default and named exports for compatibility
export default chalkMock;
export { chalkMock };

// Expose individual methods for named imports
export const {
  red, green, yellow, blue, magenta, cyan, white, gray, grey,
  bold, dim, italic, underline,
  bgRed, bgGreen, bgYellow, bgBlue, bgMagenta, bgCyan, bgWhite,
  visible
} = chalkMock; 