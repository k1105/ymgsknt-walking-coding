// External library management. Libraries are reflected as <script src> tags in
// index.html's <head>, so the preview engine picks them up for free. The
// curated list covers the common p5 ecosystem; arbitrary CDN URLs are allowed.

export interface LibOption {
  name: string;
  url: string;
}

export const CURATED_LIBS: LibOption[] = [
  {
    name: "p5.sound",
    url: "https://cdn.jsdelivr.net/npm/p5@1.11.11/lib/addons/p5.sound.min.js",
  },
  {
    name: "three.js",
    url: "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js",
  },
  {
    name: "Tone.js",
    url: "https://cdn.jsdelivr.net/npm/tone@14.8.49/build/Tone.js",
  },
  {
    name: "matter.js",
    url: "https://cdn.jsdelivr.net/npm/matter-js@0.19.0/build/matter.min.js",
  },
  {
    name: "ml5.js",
    url: "https://unpkg.com/ml5@1/dist/ml5.min.js",
  },
];

const SCRIPT_SRC_RE = /<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*><\/script>/gi;

// All external (http/protocol-relative) script URLs currently in the HTML.
export function listExternalScripts(html: string): string[] {
  const urls: string[] = [];
  let m: RegExpExecArray | null;
  SCRIPT_SRC_RE.lastIndex = 0;
  while ((m = SCRIPT_SRC_RE.exec(html))) {
    const url = m[1];
    if (/^(https?:)?\/\//i.test(url)) urls.push(url);
  }
  return urls;
}

export function hasScript(html: string, url: string): boolean {
  return listExternalScripts(html).includes(url);
}

// Insert a <script src> right before </head> (after any existing head scripts,
// so addons load after p5 itself).
export function addScript(html: string, url: string): string {
  if (hasScript(html, url)) return html;
  const tag = `    <script src="${url}"></script>\n  `;
  if (/<\/head>/i.test(html)) {
    return html.replace(/<\/head>/i, `${tag}</head>`);
  }
  // No head — prepend.
  return `<script src="${url}"></script>\n` + html;
}

export function removeScript(html: string, url: string): string {
  const esc = url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(
    `\\s*<script\\b[^>]*\\bsrc=["']${esc}["'][^>]*></script>`,
    "i",
  );
  return html.replace(re, "");
}
