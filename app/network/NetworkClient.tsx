"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as d3 from "d3";
import Link from "next/link";

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  type: "sketch" | "unexplored";
  tags: string[];
  label: string;
  research?: string;
}

interface GraphEdge extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  type: "A" | "B" | "C" | "D";
  reason: string;
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// Date string to radius: older = center, newer = outer
function dateToRadius(id: string, minDate: number, maxDate: number): number {
  const minR = 30;
  const maxR = 300;
  const unexploredR = maxR + 100;
  if (!id.match(/^\d{4}-\d{2}-\d{2}$/)) return unexploredR;
  const t = new Date(id).getTime();
  if (maxDate === minDate) return (minR + maxR) / 2;
  return minR + ((t - minDate) / (maxDate - minDate)) * (maxR - minR);
}

// Edge style based on type
function getEdgeStyle(type: string) {
  switch (type) {
    case "A": return { width: 2, dash: "none", opacity: 0.6 };      // explicit reference
    case "B": return { width: 1.2, dash: "none", opacity: 0.4 };    // same tech
    case "C": return { width: 1, dash: "4,3", opacity: 0.35 };      // theme similarity
    case "D": return { width: 1, dash: "2,4", opacity: 0.3 };       // unexplored
    default:  return { width: 1, dash: "none", opacity: 0.3 };
  }
}

const EDGE_TYPE_LABELS: Record<string, string> = {
  A: "明示的参照",
  B: "同一技術",
  C: "テーマ類似",
  D: "未踏への推測",
};

export default function NetworkClient() {
  const svgRef = useRef<SVGSVGElement>(null);
  const router = useRouter();
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<GraphEdge | null>(null);
  const [currentZoom, setCurrentZoom] = useState(1);
  const [researchContent, setResearchContent] = useState<string | null>(null);
  const [researchNode, setResearchNode] = useState<GraphNode | null>(null);

  useEffect(() => {
    fetch("/graph.json")
      .then((res) => res.json())
      .then((data: GraphData) => setGraphData(data));
  }, []);

  useEffect(() => {
    if (!graphData || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = window.innerWidth;
    const height = window.innerHeight;
    const cx = width / 2;
    const cy = height / 2;

    svg.attr("width", width).attr("height", height);

    const g = svg.append("g");

    // Zoom
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
        setCurrentZoom(event.transform.k);
      });

    svg.call(zoom);

    // Deep copy
    const nodes: GraphNode[] = graphData.nodes.map((n) => ({ ...n }));
    const edges: GraphEdge[] = graphData.edges.map((e) => ({ ...e }));

    // Calculate date range for radial layout
    const sketchDates = nodes
      .filter((n) => n.type === "sketch")
      .map((n) => new Date(n.id).getTime());
    const minDate = Math.min(...sketchDates);
    const maxDate = Math.max(...sketchDates);

    // Force simulation with radial layout
    const simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3
          .forceLink<GraphNode, GraphEdge>(edges)
          .id((d) => d.id)
          .distance(50)
          .strength(0.4)
      )
      .force("charge", d3.forceManyBody().strength(-40))
      .force("center", d3.forceCenter(cx, cy).strength(0.02))
      .force(
        "radial",
        d3.forceRadial<GraphNode>(
          (d) => dateToRadius(d.id, minDate, maxDate),
          cx,
          cy
        ).strength(0.7)
      )
      .force("collision", d3.forceCollide().radius(20));

    // Edge lines
    const link = g
      .append("g")
      .selectAll("line")
      .data(edges)
      .join("line")
      .attr("stroke", "#000")
      .attr("stroke-opacity", (d) => getEdgeStyle(d.type).opacity)
      .attr("stroke-width", (d) => getEdgeStyle(d.type).width)
      .attr("stroke-dasharray", (d) => getEdgeStyle(d.type).dash)
      .on("mouseenter", (_, d) => setHoveredEdge(d))
      .on("mouseleave", () => setHoveredEdge(null))
      .style("pointer-events", "stroke");

    // Edge labels (reason text on edges)
    const edgeLabelGroup = g.append("g").attr("class", "edge-labels");
    const edgeLabels = edgeLabelGroup
      .selectAll("text")
      .data(edges)
      .join("text")
      .text((d) => d.reason)
      .attr("font-size", "8px")
      .attr("font-family", "var(--font-geist-mono), monospace")
      .attr("fill", "#999")
      .attr("text-anchor", "middle")
      .attr("dy", -4)
      .style("pointer-events", "none")
      .style("opacity", 0);

    // Nodes
    let dragStartPos: { x: number; y: number } | null = null;

    const node = g
      .append("g")
      .selectAll<SVGGElement, GraphNode>("g")
      .data(nodes)
      .join("g")
      .call(
        d3
          .drag<SVGGElement, GraphNode>()
          .on("start", (event, d) => {
            dragStartPos = { x: event.x, y: event.y };
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
            if (dragStartPos) {
              const dx = event.x - dragStartPos.x;
              const dy = event.y - dragStartPos.y;
              if (Math.sqrt(dx * dx + dy * dy) < 5) {
                if (d.type === "sketch") {
                  router.push(`/diary/${d.id}`);
                } else if (d.type === "unexplored" && d.research) {
                  fetch(d.research)
                    .then((res) => res.ok ? res.text() : null)
                    .then((text) => {
                      if (text) {
                        setResearchNode(d);
                        setResearchContent(text);
                      }
                    });
                }
              }
            }
            dragStartPos = null;
          })
      )
      .on("mouseenter", (_, d) => setHoveredNode(d))
      .on("mouseleave", () => setHoveredNode(null))
      .style("cursor", (d) => (d.type === "sketch" ? "pointer" : "grab"));

    // Circle
    node
      .append("circle")
      .attr("r", (d) => (d.type === "sketch" ? 6 : 5))
      .attr("fill", (d) => (d.type === "sketch" ? "#000" : "none"))
      .attr("stroke", (d) => (d.type === "sketch" ? "none" : "#000"))
      .attr("stroke-width", (d) => (d.type === "sketch" ? 0 : 1.5))
      .attr("stroke-dasharray", (d) =>
        d.type === "unexplored" ? "3,2" : "none"
      );

    // Node label
    node
      .append("text")
      .text((d) => {
        if (d.type === "sketch") {
          const parts = d.id.split("-");
          return `${parts[1]}/${parts[2]}`;
        }
        return d.label;
      })
      .attr("x", 12)
      .attr("y", 4)
      .attr("font-size", (d) => (d.type === "sketch" ? "11px" : "10px"))
      .attr("font-family", "var(--font-geist-mono), monospace")
      .attr("fill", (d) => (d.type === "sketch" ? "#000" : "#666"))
      .attr("font-style", (d) =>
        d.type === "unexplored" ? "italic" : "normal"
      );

    // Tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d) => (d.source as GraphNode).x!)
        .attr("y1", (d) => (d.source as GraphNode).y!)
        .attr("x2", (d) => (d.target as GraphNode).x!)
        .attr("y2", (d) => (d.target as GraphNode).y!);

      edgeLabels
        .attr(
          "x",
          (d) =>
            ((d.source as GraphNode).x! + (d.target as GraphNode).x!) / 2
        )
        .attr(
          "y",
          (d) =>
            ((d.source as GraphNode).y! + (d.target as GraphNode).y!) / 2
        );

      node.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [graphData, router]);

  // Update edge label visibility based on zoom
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll<SVGTextElement, GraphEdge>(".edge-labels text")
      .style("opacity", currentZoom > 1.5 ? 1 : 0);
  }, [currentZoom]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-white">
      <svg ref={svgRef} className="w-full h-full" />

      {/* Tooltip */}
      {hoveredNode && (
        <div
          className="fixed bottom-8 left-8 bg-white border border-black px-4 py-3 max-w-sm z-50"
          style={{ fontFamily: "var(--font-geist-mono), monospace" }}
        >
          <div className="text-sm font-bold">
            {hoveredNode.type === "sketch" ? hoveredNode.id : hoveredNode.label}
          </div>
          {hoveredNode.type === "sketch" && (
            <div className="text-xs mt-1">{hoveredNode.label}</div>
          )}
          <div className="text-xs mt-1 text-gray-500">
            {hoveredNode.tags.join(", ")}
          </div>
          {hoveredNode.type === "sketch" && (
            <div className="text-xs mt-2 underline">click → diary</div>
          )}
          {hoveredNode.type === "unexplored" && (
            <div className="text-xs mt-1 italic text-gray-400">
              {hoveredNode.research ? "click → research" : "未踏（調査なし）"}
            </div>
          )}
        </div>
      )}

      {/* Edge tooltip */}
      {hoveredEdge && !hoveredNode && (
        <div
          className="fixed bottom-8 left-8 bg-white border border-gray-300 px-4 py-3 max-w-sm z-50"
          style={{ fontFamily: "var(--font-geist-mono), monospace" }}
        >
          <div className="text-xs text-gray-400 mb-1">
            {EDGE_TYPE_LABELS[(hoveredEdge as GraphEdge).type] ?? ""}
          </div>
          <div className="text-xs text-gray-500">
            {(hoveredEdge.source as GraphNode).id} →{" "}
            {(hoveredEdge.target as GraphNode).id}
          </div>
          <div className="text-xs mt-1">{hoveredEdge.reason}</div>
        </div>
      )}

      {/* Legend */}
      <div
        className="fixed bottom-8 right-8 text-xs z-50"
        style={{ fontFamily: "var(--font-geist-mono), monospace" }}
      >
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full bg-black" />
            <span>sketch</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full border border-black"
              style={{ borderStyle: "dashed" }}
            />
            <span className="text-gray-500 italic">unexplored</span>
          </div>
        </div>
        <div className="text-gray-400">
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-6 border-t-2 border-black" />
            <span>A: 明示的参照</span>
          </div>
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-6 border-t border-black" />
            <span>B: 同一技術</span>
          </div>
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-6 border-t border-black border-dashed" />
            <span>C: テーマ類似</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-6 border-t border-black"
              style={{ borderStyle: "dotted" }}
            />
            <span>D: 未踏への推測</span>
          </div>
        </div>
        <div className="mt-3 text-gray-300">中心=古い 外側=新しい</div>
      </div>

      {/* Research Panel */}
      {researchContent && researchNode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
          <div
            className="bg-white border border-black max-w-lg max-h-[80vh] overflow-y-auto p-6 relative"
            style={{ fontFamily: "var(--font-geist-mono), monospace" }}
          >
            <button
              onClick={() => { setResearchContent(null); setResearchNode(null); }}
              className="absolute top-3 right-3 text-gray-400 hover:text-black text-sm"
            >
              ✕
            </button>
            <div className="text-xs text-gray-400 mb-1 italic">unexplored</div>
            <div className="text-sm font-bold mb-4">{researchNode.label}</div>
            <div className="text-xs leading-relaxed whitespace-pre-wrap">
              {researchContent}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
