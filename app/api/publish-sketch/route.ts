import {NextRequest, NextResponse} from "next/server";
import fs from "fs";
import path from "path";

// Publish an editor sketch (VFS) into the static pipeline under
// public/sketches/<date>/. Dev only — the public site serves these files, so
// publishing is a local authoring step (commit afterwards to deploy).

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

  const dir = path.join(process.cwd(), "public", "sketches", date);
  fs.mkdirSync(dir, {recursive: true});

  for (const [name, file] of Object.entries(sketch.files)) {
    if (name.includes("..") || name.includes("/")) {
      return NextResponse.json({error: `Invalid filename: ${name}`}, {status: 400});
    }
    const target = path.join(dir, name);
    if (file.dataUrl) {
      // data:<mime>;base64,<payload>
      const m = /^data:[^;]*;base64,(.*)$/.exec(file.dataUrl);
      if (m) fs.writeFileSync(target, Buffer.from(m[1], "base64"));
    } else {
      fs.writeFileSync(target, file.content ?? "", "utf-8");
    }
  }

  // Ensure meta.json / diary.md exist so diary/network can read the entry.
  const metaPath = path.join(dir, "meta.json");
  if (!fs.existsSync(metaPath)) {
    fs.writeFileSync(metaPath, JSON.stringify({date, p5jsSketchId: ""}, null, 2));
  }
  const diaryPath = path.join(dir, "diary.md");
  if (!fs.existsSync(diaryPath)) fs.writeFileSync(diaryPath, "");

  return NextResponse.json({ok: true, date, files: Object.keys(sketch.files)});
}
