// p5.js autocomplete source for CodeMirror 6. A curated list of the most-used
// p5 globals (functions + constants); attached to JS files as language data so
// it augments — not replaces — the default JavaScript completions.
import type {CompletionContext, CompletionResult} from "@codemirror/autocomplete";

const FUNCTIONS = [
  // structure / environment
  "setup", "draw", "preload", "createCanvas", "resizeCanvas", "noCanvas",
  "windowResized", "frameRate", "noLoop", "loop", "redraw", "pixelDensity",
  // 2d primitives
  "background", "clear", "fill", "noFill", "stroke", "noStroke", "strokeWeight",
  "point", "line", "rect", "square", "ellipse", "circle", "arc", "triangle",
  "quad", "beginShape", "endShape", "vertex", "curveVertex", "bezierVertex",
  "rectMode", "ellipseMode", "erase", "noErase",
  // transforms
  "push", "pop", "translate", "rotate", "rotateX", "rotateY", "rotateZ",
  "scale", "shearX", "shearY", "applyMatrix", "resetMatrix",
  // color
  "color", "lerpColor", "red", "green", "blue", "alpha", "hue", "saturation",
  "brightness", "colorMode",
  // math
  "random", "randomSeed", "randomGaussian", "noise", "noiseSeed", "noiseDetail",
  "map", "lerp", "constrain", "dist", "mag", "norm", "abs", "ceil", "floor",
  "round", "sqrt", "sq", "pow", "exp", "log", "min", "max", "sin", "cos", "tan",
  "atan2", "radians", "degrees", "createVector",
  // text
  "text", "textSize", "textAlign", "textFont", "textWidth", "textLeading",
  "textStyle", "loadFont", "createFont",
  // image / pixels
  "loadImage", "image", "imageMode", "tint", "noTint", "createImage",
  "loadPixels", "updatePixels", "get", "set", "copy", "blend", "filter",
  // input / dom
  "mousePressed", "mouseReleased", "mouseClicked", "mouseMoved", "mouseDragged",
  "mouseWheel", "keyPressed", "keyReleased", "keyTyped", "keyIsDown",
  "createButton", "createSlider", "createInput", "select", "createDiv",
  // webgl / shaders
  "loadShader", "createShader", "shader", "resetShader", "setUniform",
  "box", "sphere", "cylinder", "cone", "torus", "plane", "model", "loadModel",
  "ambientLight", "directionalLight", "pointLight", "normalMaterial",
  "ambientMaterial", "specularMaterial", "camera", "perspective", "ortho",
  "orbitControl", "texture", "normalize",
  // data / io
  "loadStrings", "loadJSON", "loadTable", "saveCanvas", "save", "httpGet",
  "millis", "second", "minute", "hour", "day", "month", "year",
];

const CONSTANTS = [
  "width", "height", "mouseX", "mouseY", "pmouseX", "pmouseY", "winMouseX",
  "winMouseY", "mouseButton", "mouseIsPressed", "key", "keyCode", "keyIsPressed",
  "frameCount", "deltaTime", "windowWidth", "windowHeight", "displayWidth",
  "displayHeight", "PI", "TWO_PI", "TAU", "HALF_PI", "QUARTER_PI", "DEGREES",
  "RADIANS", "WEBGL", "P2D", "CENTER", "CORNER", "CORNERS", "RADIUS", "LEFT",
  "RIGHT", "TOP", "BOTTOM", "BASELINE", "CLOSE", "OPEN", "RGB", "HSB", "HSL",
  "BLEND", "ADD", "MULTIPLY", "SCREEN", "NORMAL", "BOLD", "ITALIC",
];

const OPTIONS = [
  ...FUNCTIONS.map((label) => ({label, type: "function", boost: 1})),
  ...CONSTANTS.map((label) => ({label, type: "constant"})),
];

export function p5CompletionSource(
  context: CompletionContext,
): CompletionResult | null {
  const word = context.matchBefore(/[\w$]+/);
  if (!word || (word.from === word.to && !context.explicit)) return null;
  return {from: word.from, options: OPTIONS, validFor: /^[\w$]*$/};
}
