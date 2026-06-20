import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

interface GraphNode {
  id: string;
  type: "sketch" | "unexplored" | "explored";
  [k: string]: unknown;
}
interface GraphEdge {
  source: string;
  target: string;
  type: "A" | "B" | "C" | "D";
  reason?: string;
}

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Dev only" }, { status: 403 });
  }

  const { date } = await req.json();
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const sketchDir = path.join(process.cwd(), "public", "sketches", date);
  if (fs.existsSync(sketchDir)) {
    fs.rmSync(sketchDir, { recursive: true, force: true });
  }

  const graphPath = path.join(process.cwd(), "public", "graph.json");
  if (fs.existsSync(graphPath)) {
    try {
      const graph = JSON.parse(fs.readFileSync(graphPath, "utf-8")) as {
        nodes: GraphNode[];
        edges: GraphEdge[];
      };

      // Find type-B edges that brought this sketch into existence from an
      // explored node. Their source nodes are candidates to revert to
      // unexplored — but only if no *other* sketch still traces them.
      const incomingBFromExplored = graph.edges.filter(
        (e) =>
          e.target === date &&
          e.type === "B" &&
          graph.nodes.find((n) => n.id === e.source)?.type === "explored",
      );

      // Drop all edges touching this node
      graph.edges = graph.edges.filter(
        (e) => e.source !== date && e.target !== date,
      );

      // Revert explored → unexplored where no other B-edge remains
      for (const e of incomingBFromExplored) {
        const stillTraced = graph.edges.some(
          (other) => other.source === e.source && other.type === "B",
        );
        if (!stillTraced) {
          const node = graph.nodes.find((n) => n.id === e.source);
          if (node && node.type === "explored") node.type = "unexplored";
        }
      }

      // Remove the sketch node itself
      graph.nodes = graph.nodes.filter((n) => n.id !== date);

      fs.writeFileSync(graphPath, JSON.stringify(graph, null, 2));
    } catch (err) {
      console.error("Failed to update graph.json:", err);
      return NextResponse.json({ error: "Graph update failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ date });
}
