import {NextRequest, NextResponse} from "next/server";
import fs from "fs";
import path from "path";

// Read a published sketch under public/sketches/<id>/ into the editor's VFS
// shape so the editor can seed a new working draft from it. Read-only.
//
// diary.md/diary.mdx are returned as `diary` (the diary panel), not as files.
// meta.json and thumbnail.png are sketch metadata, not editable files — skipped.

const SKIP = new Set(["meta.json", "thumbnail.png", "diary.md", "diary.mdx"]);

const EXT_MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  ttf: "font/ttf",
  otf: "font/otf",
  woff: "font/woff",
  woff2: "font/woff2",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  ogg: "audio/ogg",
  glb: "model/gltf-binary",
  gltf: "model/gltf+json",
};

const TEXT_EXT = new Set([
  "js",
  "mjs",
  "frag",
  "vert",
  "glsl",
  "css",
  "html",
  "htm",
  "json",
  "txt",
  "md",
]);

const extOf = (name: string) => {
  const i = name.lastIndexOf(".");
  return i === -1 ? "" : name.slice(i + 1).toLowerCase();
};

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id || !/^[\w-]+$/.test(id)) {
    return NextResponse.json({error: "Invalid id"}, {status: 400});
  }

  const dir = path.join(process.cwd(), "public", "sketches", id);
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
    return NextResponse.json({error: "Source not found"}, {status: 404});
  }

  const files: Record<string, {name: string; content: string; dataUrl?: string}> =
    {};
  let diary = "";
  let parentTags: string[] = [];

  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (!fs.statSync(full).isFile()) continue;

    if (name === "diary.md" || name === "diary.mdx") {
      diary = fs.readFileSync(full, "utf-8");
      continue;
    }
    if (name === "meta.json") {
      try {
        const meta = JSON.parse(fs.readFileSync(full, "utf-8"));
        if (Array.isArray(meta.tags)) parentTags = meta.tags;
      } catch {
        // ignore malformed meta
      }
      continue;
    }
    if (SKIP.has(name)) continue;

    const ext = extOf(name);
    if (TEXT_EXT.has(ext)) {
      files[name] = {name, content: fs.readFileSync(full, "utf-8")};
    } else if (EXT_MIME[ext]) {
      const b64 = fs.readFileSync(full).toString("base64");
      files[name] = {
        name,
        content: "",
        dataUrl: `data:${EXT_MIME[ext]};base64,${b64}`,
      };
    }
    // unknown extensions are skipped
  }

  const entry = files["index.html"] ? "index.html" : Object.keys(files)[0] ?? "index.html";

  return NextResponse.json({id, entry, files, diary, tags: parentTags});
}
