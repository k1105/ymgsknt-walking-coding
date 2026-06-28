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

  const {sketch, date: dateInput, diary, parentId} = (await req.json()) as {
    sketch: Sketch;
    date?: string;
    diary?: string;
    parentId?: string;
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

  const sketchesDir = path.join(process.cwd(), "public", "sketches");

  // Inherit tags from the parent sketch so the new entry/graph node is
  // categorised consistently.
  let tags: string[] = [];
  if (parentId && /^[\w-]+$/.test(parentId)) {
    const parentMeta = path.join(sketchesDir, parentId, "meta.json");
    if (fs.existsSync(parentMeta)) {
      try {
        const pm = JSON.parse(fs.readFileSync(parentMeta, "utf-8"));
        if (Array.isArray(pm.tags)) tags = pm.tags;
      } catch {
        // ignore malformed parent meta
      }
    }
  }

  // Write the diary (the editor's diary panel) and meta.json so diary/network
  // can read the entry.
  fs.writeFileSync(path.join(dir, "diary.md"), diary ?? "", "utf-8");

  const metaPath = path.join(dir, "meta.json");
  let meta: Record<string, unknown> = {date, p5jsSketchId: "", tags};
  if (fs.existsSync(metaPath)) {
    try {
      meta = {...JSON.parse(fs.readFileSync(metaPath, "utf-8")), date};
    } catch {
      // keep the fresh default on malformed meta
    }
  }
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));

  // Wire the graph: add the node + an edge from the parent (idempotent).
  const graphPath = path.join(process.cwd(), "public", "graph.json");
  if (fs.existsSync(graphPath)) {
    try {
      const graph = JSON.parse(fs.readFileSync(graphPath, "utf-8"));
      let changed = false;
      if (!graph.nodes.find((n: {id: string}) => n.id === date)) {
        graph.nodes.push({
          id: date,
          type: "sketch",
          tags,
          label: parentId ? `${parentId}の続き` : date,
        });
        changed = true;
      }
      if (
        parentId &&
        !graph.edges.find(
          (e: {source: unknown; target: unknown}) => {
            const s = typeof e.source === "object" ? (e.source as {id: string}).id : e.source;
            const t = typeof e.target === "object" ? (e.target as {id: string}).id : e.target;
            return s === parentId && t === date;
          },
        )
      ) {
        graph.edges.push({
          source: parentId,
          target: date,
          type: "A",
          reason: `${parentId}からの続き`,
        });
        changed = true;
      }
      if (changed) fs.writeFileSync(graphPath, JSON.stringify(graph, null, 2) + "\n");
    } catch (e) {
      console.error("Failed to update graph.json:", e);
    }
  }

  return NextResponse.json({ok: true, date, files: Object.keys(sketch.files)});
}
