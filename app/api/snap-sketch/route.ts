import {NextRequest, NextResponse} from "next/server";
import fs from "fs";
import path from "path";

// Freeze the current editor state as a snap under
// public/sketches/<date>/snaps/<snapId>/. Dev only, like publish-sketch —
// snaps are static files committed alongside the sketch. A date can hold any
// number of snaps; meta.json's `snaps` array is the ordered list the diary
// page reads.

interface VFile {
  name: string;
  content: string;
  dataUrl?: string;
}
interface Sketch {
  id: string;
  entry: string;
  files: Record<string, VFile>;
}

function snapId(now: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}${p(now.getMonth() + 1)}${p(now.getDate())}-${p(now.getHours())}${p(now.getMinutes())}${p(now.getSeconds())}`;
}

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({error: "Dev only"}, {status: 403});
  }

  const {sketch, date: dateInput} = (await req.json()) as {
    sketch: Sketch;
    date?: string;
  };

  if (!sketch?.files || typeof sketch.files !== "object") {
    return NextResponse.json({error: "Missing sketch"}, {status: 400});
  }

  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const date = dateInput || today;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({error: "Invalid date"}, {status: 400});
  }

  // Same-second snaps get a numeric suffix instead of overwriting.
  const snapsRoot = path.join(process.cwd(), "public", "sketches", date, "snaps");
  let id = snapId(now);
  for (let n = 2; fs.existsSync(path.join(snapsRoot, id)); n++) {
    id = `${snapId(now)}-${n}`;
  }
  const snapDir = path.join(snapsRoot, id);
  fs.mkdirSync(snapDir, {recursive: true});

  for (const [name, file] of Object.entries(sketch.files)) {
    if (name.includes("..") || name.includes("/")) {
      return NextResponse.json({error: `Invalid filename: ${name}`}, {status: 400});
    }
    const target = path.join(snapDir, name);
    if (file.dataUrl) {
      const m = /^data:[^;]*;base64,(.*)$/.exec(file.dataUrl);
      if (m) fs.writeFileSync(target, Buffer.from(m[1], "base64"));
    } else {
      fs.writeFileSync(target, file.content ?? "", "utf-8");
    }
  }

  // Record the snap in meta.json (created with defaults if the sketch hasn't
  // been published yet).
  const metaPath = path.join(process.cwd(), "public", "sketches", date, "meta.json");
  let meta: Record<string, unknown> = {date, p5jsSketchId: "", tags: []};
  if (fs.existsSync(metaPath)) {
    try {
      meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
    } catch {
      // keep the fresh default on malformed meta
    }
  }
  const snaps = Array.isArray(meta.snaps) ? meta.snaps : [];
  snaps.push({id, createdAt: now.toISOString()});
  meta.snaps = snaps;
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));

  return NextResponse.json({ok: true, date, id});
}
