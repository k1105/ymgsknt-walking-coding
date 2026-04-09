"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import Link from "next/link";

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  type: "sketch" | "unexplored";
  tags: string[];
  label: string;
}

interface GraphEdge extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  reason: string;
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export default function NetworkClient() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<GraphEdge | null>(null);

  useEffect(() => {
    fetch("/graph.json")
      .then((res) => res.json())
      .then((data) => setGraphData(data));
  }, []);

  useEffect(() => {
    if (!graphData || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = window.innerWidth;
    const height = window.innerHeight;

    svg.attr("width", width).attr("height", height);

    const g = svg.append("g");

    // Zoom
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Deep copy nodes and edges for simulation
    const nodes: GraphNode[] = graphData.nodes.map((n) => ({ ...n }));
    const edges: GraphEdge[] = graphData.edges.map((e) => ({ ...e }));

    // Force simulation
    const simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3
          .forceLink<GraphNode, GraphEdge>(edges)
          .id((d) => d.id)
          .distance(120)
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(40));

    // Edges
    const link = g
      .append("g")
      .selectAll("line")
      .data(edges)
      .join("line")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.4)
      .attr("stroke-width", 1)
      .on("mouseenter", (_, d) => setHoveredEdge(d))
      .on("mouseleave", () => setHoveredEdge(null));

    // Nodes
    const node = g
      .append("g")
      .selectAll<SVGGElement, GraphNode>("g")
      .data(nodes)
      .join("g")
      .call(
        d3
          .drag<SVGGElement, GraphNode>()
          .on("start", (event, d) => {
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
          })
      )
      .on("mouseenter", (_, d) => setHoveredNode(d))
      .on("mouseleave", () => setHoveredNode(null));

    // Circle for each node
    node
      .append("circle")
      .attr("r", (d) => (d.type === "sketch" ? 6 : 5))
      .attr("fill", (d) => (d.type === "sketch" ? "#000" : "none"))
      .attr("stroke", (d) => (d.type === "sketch" ? "none" : "#000"))
      .attr("stroke-width", (d) => (d.type === "sketch" ? 0 : 1.5))
      .attr("stroke-dasharray", (d) => (d.type === "unexplored" ? "3,2" : "none"));

    // Label
    node
      .append("text")
      .text((d) => {
        if (d.type === "sketch") {
          const date = d.id;
          const parts = date.split("-");
          return `${parts[1]}/${parts[2]}`;
        }
        return d.label;
      })
      .attr("x", 12)
      .attr("y", 4)
      .attr("font-size", (d) => (d.type === "sketch" ? "11px" : "10px"))
      .attr("font-family", "var(--font-geist-mono), monospace")
      .attr("fill", (d) => (d.type === "sketch" ? "#000" : "#666"))
      .attr("font-style", (d) => (d.type === "unexplored" ? "italic" : "normal"));

    // Tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d) => (d.source as GraphNode).x!)
        .attr("y1", (d) => (d.source as GraphNode).y!)
        .attr("x2", (d) => (d.target as GraphNode).x!)
        .attr("y2", (d) => (d.target as GraphNode).y!);

      node.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [graphData]);

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
            <Link
              href={`/diary/${hoveredNode.id}`}
              className="text-xs underline mt-2 inline-block"
            >
              → diary
            </Link>
          )}
          {hoveredNode.type === "unexplored" && (
            <div className="text-xs mt-1 italic text-gray-400">未踏</div>
          )}
        </div>
      )}

      {/* Edge tooltip */}
      {hoveredEdge && !hoveredNode && (
        <div
          className="fixed bottom-8 left-8 bg-white border border-gray-300 px-4 py-3 max-w-sm z-50"
          style={{ fontFamily: "var(--font-geist-mono), monospace" }}
        >
          <div className="text-xs text-gray-500">
            {(hoveredEdge.source as GraphNode).id} →{" "}
            {(hoveredEdge.target as GraphNode).id}
          </div>
          <div className="text-xs mt-1">{hoveredEdge.reason}</div>
        </div>
      )}

      {/* Legend */}
      <div
        className="fixed top-8 left-8 text-xs z-50"
        style={{ fontFamily: "var(--font-geist-mono), monospace" }}
      >
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

      {/* Back link */}
      <Link
        href="/"
        className="fixed top-8 right-8 text-xs underline z-50"
        style={{ fontFamily: "var(--font-geist-mono), monospace" }}
      >
        ← top
      </Link>
    </div>
  );
}
