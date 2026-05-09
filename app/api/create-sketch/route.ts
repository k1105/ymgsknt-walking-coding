import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  // Local only
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Dev only" }, { status: 403 });
  }

  const { sourceId, parentId, fromUnexplored, codeUrl } = await req.json();

  const sketchesDir = path.join(process.cwd(), "public", "sketches");
  const sourceDir = path.join(sketchesDir, sourceId);
  const templateDir = path.join(sketchesDir, "_template");

  // Today's date as YYYY-MM-DD
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const targetDir = path.join(sketchesDir, today);

  if (fs.existsSync(targetDir)) {
    return NextResponse.json({ error: "Already exists", date: today }, { status: 409 });
  }

  if (fromUnexplored) {
    // Copy from _template
    if (!fs.existsSync(templateDir)) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }
    fs.cpSync(templateDir, targetDir, { recursive: true });

    // If codeUrl provided, read and write as sketch.js
    if (codeUrl) {
      const codePath = path.join(process.cwd(), "public", codeUrl);
      if (fs.existsSync(codePath)) {
        const code = fs.readFileSync(codePath, "utf-8");
        fs.writeFileSync(path.join(targetDir, "sketch.js"), code);
      }
    }
  } else {
    if (!fs.existsSync(sourceDir)) {
      return NextResponse.json({ error: "Source not found" }, { status: 404 });
    }
    // Copy directory
    fs.cpSync(sourceDir, targetDir, { recursive: true });
  }

  // Clear diary.md
  const diaryPath = path.join(targetDir, "diary.md");
  fs.writeFileSync(diaryPath, "");

  // Update meta.json with today's date
  const metaPath = path.join(targetDir, "meta.json");
  if (fs.existsSync(metaPath)) {
    try {
      const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
      meta.date = today;
      delete meta.thumbnail;
      fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));
    } catch {
      // If meta.json is malformed, create a new one
      fs.writeFileSync(metaPath, JSON.stringify({ date: today, p5jsSketchId: "" }, null, 2));
    }
  }

  // Remove thumbnail if exists
  const thumbPath = path.join(targetDir, "thumbnail.png");
  if (fs.existsSync(thumbPath)) {
    fs.unlinkSync(thumbPath);
  }

  // Update graph.json: add node + edge
  const graphPath = path.join(process.cwd(), "public", "graph.json");
  if (fs.existsSync(graphPath)) {
    try {
      const graph = JSON.parse(fs.readFileSync(graphPath, "utf-8"));

      // Check if node already exists
      if (!graph.nodes.find((n: { id: string }) => n.id === today)) {
        // Add node
        const sourceNode = graph.nodes.find((n: { id: string }) => n.id === sourceId);
        graph.nodes.push({
          id: today,
          type: "sketch",
          tags: sourceNode?.tags || [],
          label: fromUnexplored ? `${sourceId}の写経` : `${sourceId}の続き`,
        });

        // Add edge
        graph.edges.push({
          source: parentId || sourceId,
          target: today,
          type: fromUnexplored ? "B" : "A",
          reason: fromUnexplored ? `${sourceId}未踏ノードからの写経` : `${sourceId}からの続き`,
        });

        fs.writeFileSync(graphPath, JSON.stringify(graph, null, 2));
      }
    } catch (e) {
      console.error("Failed to update graph.json:", e);
    }
  }

  return NextResponse.json({ date: today, sourceId });
}
