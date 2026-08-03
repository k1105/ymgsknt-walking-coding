import {NextResponse} from "next/server";
import fs from "fs";
import path from "path";

// List published sketch dates and their snap counts for the diary editor's
// @mention autocomplete. Read-only; newest first.

export async function GET() {
  const sketchesDir = path.join(process.cwd(), "public", "sketches");
  if (!fs.existsSync(sketchesDir)) {
    return NextResponse.json({sketches: []});
  }

  const sketches = fs
    .readdirSync(sketchesDir, {withFileTypes: true})
    .filter((d) => d.isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(d.name))
    .map((d) => d.name)
    .sort()
    .reverse()
    .map((date) => {
      let snaps = 0;
      try {
        const meta = JSON.parse(
          fs.readFileSync(path.join(sketchesDir, date, "meta.json"), "utf-8"),
        );
        if (Array.isArray(meta.snaps)) snaps = meta.snaps.length;
      } catch {
        // no meta or malformed — treat as a plain sketch with no snaps
      }
      return {date, snaps};
    });

  return NextResponse.json({sketches});
}
