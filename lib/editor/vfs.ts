// Virtual File System for the online editor.
//
// The VFS is the single source of truth for a sketch's files while editing.
// Persistence (disk in dev, Firestore + IndexedDB in prod) plugs in on top of
// this shape — see later phases. The preview engine (preview.ts) consumes a
// VFS to build a fully self-contained, sandbox-safe srcdoc.

export type Lang = "js" | "glsl" | "css" | "html" | "json" | "text" | "binary";

export interface VFile {
  name: string; // bare filename, e.g. "sketch.js" or "shader.frag"
  content: string; // text content (for binary: ignored, see dataUrl)
  lang: Lang;
  dataUrl?: string; // for binary assets (images/fonts): a data: URL
}

export interface Sketch {
  id: string;
  entry: string; // usually "index.html"
  files: Record<string, VFile>;
  libraries?: string[]; // external CDN script URLs (also reflected in index.html)
}

const EXT_LANG: Record<string, Lang> = {
  js: "js",
  mjs: "js",
  frag: "glsl",
  vert: "glsl",
  glsl: "glsl",
  css: "css",
  html: "html",
  htm: "html",
  json: "json",
  txt: "text",
  md: "text",
};

const BINARY_EXT = new Set([
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "svg",
  "ttf",
  "otf",
  "woff",
  "woff2",
  "mp3",
  "wav",
  "ogg",
  "glb",
  "gltf",
]);

export function extOf(name: string): string {
  const i = name.lastIndexOf(".");
  return i === -1 ? "" : name.slice(i + 1).toLowerCase();
}

export function langOf(name: string): Lang {
  const ext = extOf(name);
  if (BINARY_EXT.has(ext)) return "binary";
  return EXT_LANG[ext] ?? "text";
}

export function makeFile(name: string, content = ""): VFile {
  return {name, content, lang: langOf(name)};
}

// Default starter sketch — a minimal p5 sketch wired the same way the
// committed sketches under public/sketches are (index.html + sketch.js +
// style.css). Keeps the published-sketch shape so publishing later is trivial.
export const DEFAULT_INDEX_HTML = `<!doctype html>
<html lang="en">
  <head>
    <script src="https://cdn.jsdelivr.net/npm/p5@1.11.11/lib/p5.js"></script>
    <link rel="stylesheet" type="text/css" href="style.css" />
    <meta charset="utf-8" />
  </head>
  <body>
    <main></main>
    <script src="sketch.js"></script>
  </body>
</html>
`;

export const DEFAULT_SKETCH_JS = `function setup() {
  createCanvas(windowWidth, windowHeight);
}

function draw() {
  background(13, 17, 23);
  noStroke();
  fill(88, 166, 255);
  circle(mouseX, mouseY, 80);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
`;

export const DEFAULT_STYLE_CSS = `html,
body {
  margin: 0;
  padding: 0;
  overflow: hidden;
}
canvas {
  display: block;
}
`;

export function defaultSketch(id: string): Sketch {
  return {
    id,
    entry: "index.html",
    files: {
      "index.html": makeFile("index.html", DEFAULT_INDEX_HTML),
      "sketch.js": makeFile("sketch.js", DEFAULT_SKETCH_JS),
      "style.css": makeFile("style.css", DEFAULT_STYLE_CSS),
    },
    libraries: [],
  };
}
