import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Dev only" }, { status: 403 });
  }

  const { date, filename, content } = await req.json();

  if (!date || !filename || content === undefined) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  // Sanitize
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }
  if (filename.includes("..") || filename.includes("/")) {
    return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
  }

  const filePath = path.join(process.cwd(), "public", "sketches", date, filename);
  const dir = path.dirname(filePath);

  if (!fs.existsSync(dir)) {
    return NextResponse.json({ error: "Sketch directory not found" }, { status: 404 });
  }

  fs.writeFileSync(filePath, content, "utf-8");

  return NextResponse.json({ ok: true, date, filename });
}
