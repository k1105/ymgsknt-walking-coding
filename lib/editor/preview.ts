// Preview engine: build a fully self-contained HTML document from a VFS that
// runs inside a sandboxed iframe (srcdoc, allow-scripts only).
//
// Why inline instead of blob: URLs? A sandboxed iframe without allow-same-origin
// has an opaque origin and cannot read blob: URLs created by the parent. So we
// inline every file into a window.__VFS__ map and patch fetch / XHR to resolve
// relative paths against it. p5's loadShader / loadStrings / loadJSON go through
// fetch, so shaders and data files resolve transparently. Binary assets are
// embedded as data: URLs.
//
// The srcdoc base URL is about:srcdoc, against which p5's internal `new Request(
// relativePath)` cannot resolve (it throws). So we inject a sentinel <base href>
// — relative paths then resolve to https://__vfs__.local/<path>, a valid URL the
// fetch/XHR shims recognise and serve from the VFS.

import type {Sketch, VFile} from "./vfs";

// Marker used so the parent can correlate console/error messages with a run.
export const PREVIEW_MESSAGE_SOURCE = "editor-preview";

// Sentinel origin that relative paths resolve against (via <base href>).
export const VFS_ORIGIN = "https://__vfs__.local/";

function escapeForScript(s: string): string {
  // Prevent a literal </script> in inlined content from closing the tag.
  return s.replace(/<\/(script)/gi, "<\\/$1");
}

function isExternal(url: string): boolean {
  return /^(https?:)?\/\//i.test(url) || /^(data|blob):/i.test(url);
}

// The runtime shim injected before any sketch code. Stringified verbatim into
// the document, so it must be self-contained (no closure refs to this module).
function buildPreamble(vfsJson: string): string {
  return `
<script>
(function () {
  var __VFS__ = ${vfsJson};
  var ORIGIN = ${JSON.stringify(VFS_ORIGIN)};
  window.__VFS__ = __VFS__;

  function normalize(p) {
    if (typeof p !== "string") p = String(p);
    p = p.split("?")[0].split("#")[0];
    if (p.indexOf(ORIGIN) === 0) p = p.slice(ORIGIN.length);
    p = p.replace(/^\\.?\\//, "").replace(/^\\//, "");
    return p;
  }
  function isVfs(url) {
    if (typeof url !== "string") return false;
    if (url.indexOf(ORIGIN) === 0) return true;
    return !/^(https?:)?\\/\\//i.test(url) && !/^(data|blob):/i.test(url);
  }
  function resolve(p) {
    var key = normalize(p);
    if (__VFS__[key]) return __VFS__[key];
    var base = key.split("/").pop();
    if (__VFS__[base]) return __VFS__[base];
    return null;
  }
  window.__resolveVFS__ = resolve;

  // --- console + error capture -> postMessage to parent ---
  function ser(a) {
    try {
      if (a instanceof Error) return a.stack || a.message;
      if (typeof a === "object") return JSON.stringify(a);
      return String(a);
    } catch (e) { return String(a); }
  }
  function post(msg) {
    try { parent.postMessage(Object.assign({__src: "${PREVIEW_MESSAGE_SOURCE}"}, msg), "*"); } catch (e) {}
  }
  ["log", "info", "warn", "error", "debug"].forEach(function (level) {
    var orig = console[level] ? console[level].bind(console) : function () {};
    console[level] = function () {
      var args = Array.prototype.slice.call(arguments);
      post({type: "console", level: level, text: args.map(ser).join(" ")});
      orig.apply(null, arguments);
    };
  });
  window.addEventListener("error", function (e) {
    post({type: "error", text: (e.message || "Error") + (e.lineno ? " (line " + e.lineno + ")" : "")});
  });
  window.addEventListener("unhandledrejection", function (e) {
    post({type: "error", text: "Unhandled rejection: " + ser(e.reason)});
  });

  // --- fetch shim: resolve VFS paths ---
  var realFetch = window.fetch ? window.fetch.bind(window) : null;
  window.fetch = function (input, init) {
    var url = typeof input === "string" ? input : (input && input.url);
    if (isVfs(url)) {
      var f = resolve(url);
      if (f) {
        if (f.dataUrl) {
          return realFetch ? realFetch(f.dataUrl) : Promise.reject(new Error("no fetch"));
        }
        return Promise.resolve(new Response(f.content, {status: 200, headers: {"Content-Type": "text/plain"}}));
      }
    }
    if (realFetch) return realFetch(input, init);
    return Promise.reject(new Error("fetch unavailable for " + url));
  };

  // --- XHR shim (some p5 paths use XHR) ---
  var RealXHR = window.XMLHttpRequest;
  if (RealXHR) {
    var open = RealXHR.prototype.open;
    var send = RealXHR.prototype.send;
    RealXHR.prototype.open = function (method, url) {
      this.__vfsUrl = url;
      return open.apply(this, arguments);
    };
    RealXHR.prototype.send = function (body) {
      var url = this.__vfsUrl;
      if (isVfs(url)) {
        var f = resolve(url);
        if (f && !f.dataUrl) {
          var self = this;
          setTimeout(function () {
            Object.defineProperty(self, "readyState", {value: 4, configurable: true});
            Object.defineProperty(self, "status", {value: 200, configurable: true});
            Object.defineProperty(self, "responseText", {value: f.content, configurable: true});
            Object.defineProperty(self, "response", {value: f.content, configurable: true});
            if (typeof self.onreadystatechange === "function") self.onreadystatechange();
            if (typeof self.onload === "function") self.onload();
            try { self.dispatchEvent(new Event("load")); } catch (e) {}
          }, 0);
          return;
        }
      }
      return send.apply(this, arguments);
    };
  }
})();
</script>`;
}

// Inline a sketch's files into a single self-contained HTML document.
export function buildPreviewSrcdoc(sketch: Sketch): string {
  const files = sketch.files;
  const entry = files[sketch.entry] ?? files["index.html"];
  let html = entry ? entry.content : "<!doctype html><html><head></head><body></body></html>";

  // VFS map exposed to the runtime shim. Only text + dataUrl are needed.
  const vfsMap: Record<string, {content?: string; dataUrl?: string}> = {};
  for (const f of Object.values(files) as VFile[]) {
    vfsMap[f.name] = f.dataUrl ? {dataUrl: f.dataUrl} : {content: f.content};
  }
  const vfsJson = JSON.stringify(vfsMap).replace(/<\//g, "<\\/");

  // Replace local <link rel=stylesheet href="x.css"> with inline <style>.
  html = html.replace(
    /<link\b[^>]*href=["']([^"']+)["'][^>]*>/gi,
    (m, href) => {
      if (isExternal(href)) return m;
      const f = files[href] ?? files[href.replace(/^\.?\//, "")];
      if (f && f.lang === "css") {
        return `<style>\n${f.content}\n</style>`;
      }
      return m;
    },
  );

  // Replace local <script src="x.js"> with inline <script>.
  html = html.replace(
    /<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*><\/script>/gi,
    (m, src) => {
      if (isExternal(src)) return m;
      const f = files[src] ?? files[src.replace(/^\.?\//, "")];
      if (f) {
        return `<script>\n${escapeForScript(f.content)}\n</script>`;
      }
      return m;
    },
  );

  // Inject <base> (so relative runtime fetches resolve to a valid URL) followed
  // by the preamble, as the very first things in <head>.
  const head = `<base href="${VFS_ORIGIN}">` + buildPreamble(vfsJson);
  if (/<head[^>]*>/i.test(html)) {
    html = html.replace(/<head[^>]*>/i, (m) => m + head);
  } else {
    html = head + html;
  }

  return html;
}
