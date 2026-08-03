import {NextRequest, NextResponse} from "next/server";
import fs from "fs";
import path from "path";

// Save a diary image under public/sketches/<date>/images/ and return the
// relative path (./images/<name>) to embed in diary.md — lib/data.ts rewrites
// it to the absolute /sketches/<date>/images/<name> when serving. Dev only,
// like publish-sketch: images are static files committed alongside the sketch.

const DATE_ID = /^\d{4}-\d{2}-\d{2}$/;

const EXT_BY_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({error: "Dev only"}, {status: 403});
  }

  const {date, name, dataUrl} = (await req.json()) as {
    date?: string;
    name?: string;
    dataUrl?: string;
  };

  if (!date || !DATE_ID.test(date)) {
    return NextResponse.json({error: "Invalid date"}, {status: 400});
  }
  const m = /^data:([^;]+);base64,(.*)$/.exec(dataUrl ?? "");
  if (!m || !EXT_BY_MIME[m[1]]) {
    return NextResponse.json(
      {error: "Invalid image (expected base64 data URL)"},
      {status: 400},
    );
  }

  // Sanitize the filename: keep the basename, drop anything but [\w.-], and
  // force the extension to match the actual mime type.
  const ext = EXT_BY_MIME[m[1]];
  const rawBase = (name ?? "").split(/[\\/]/).pop() ?? "";
  const base =
    rawBase.replace(/\.[^.]*$/, "").replace(/[^\w-]/g, "-").replace(/^-+|-+$/g, "") ||
    "image";

  const dir = path.join(process.cwd(), "public", "sketches", date, "images");
  fs.mkdirSync(dir, {recursive: true});

  // Never overwrite: suffix -2, -3, … on collision.
  let filename = `${base}.${ext}`;
  for (let n = 2; fs.existsSync(path.join(dir, filename)); n++) {
    filename = `${base}-${n}.${ext}`;
  }
  fs.writeFileSync(path.join(dir, filename), Buffer.from(m[2], "base64"));

  return NextResponse.json({ok: true, src: `./images/${filename}`});
}
