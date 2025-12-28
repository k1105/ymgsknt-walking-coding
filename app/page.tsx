"use client";

import Link from "next/link";
import Image from "next/image";
import {useEffect, useRef, useState, useMemo, useCallback} from "react";
import {dummyDiaryEntries} from "@/lib/data";
import {drawRoughCurve} from "@/lib/canvas";

// --- Types ---
interface DateNode {
  id: string;
  date: string;
  displayDate: string;
  monthIndex: number;
  networkX: number;
  networkY: number;
  calendarX: number;
  calendarY: number;
  thumbnailUrl?: string;
}

// --- Helpers ---
function formatDateDisplay(dateStr: string) {
  const date = new Date(dateStr);
  const year = String(date.getFullYear()).slice(-2).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}\n${month}\n${day}`;
}

// Tailwindの "ease-in-out" に近い Cubic Easing 関数
function easeInOutCubic(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

// CSS transition用のベジェ曲線 (easeInOutCubicの近似)
const CSS_EASE_CUBIC = "cubic-bezier(0.65, 0, 0.35, 1)";

// --- Components ---

// Canvas Based Connecting Lines
function ConnectingLines({
  nodes,
  viewMode,
  onAnimationComplete,
}: {
  nodes: DateNode[];
  viewMode: "network" | "calendar";
  onAnimationComplete?: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // アニメーション管理用のRef
  const animRef = useRef<{
    startTime: number | null;
    startNodes: DateNode[] | null;
    targetNodes: DateNode[] | null;
    animationFrameId: number | null;
    isInitialLoad: boolean;
    initialStrokeProgress: number;
    viewModeChanged: boolean;
    prevViewMode: "network" | "calendar";
  }>({
    startTime: null,
    startNodes: null,
    targetNodes: null,
    animationFrameId: null,
    isInitialLoad: true,
    initialStrokeProgress: 0,
    viewModeChanged: false,
    prevViewMode: viewMode,
  });

  const prevNodesRef = useRef<DateNode[]>(nodes);
  const prevViewModeRef = useRef<"network" | "calendar">(viewMode);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || nodes.length === 0) return;

    const dpr = window.devicePixelRatio || 1;

    const resizeCanvas = () => {
      const maxY = nodes.reduce((max, node) => {
        const y = viewMode === "network" ? node.networkY : node.calendarY;
        return Math.max(max, y);
      }, 0);
      const height = Math.max(maxY + 200, window.innerHeight);

      canvas.width = window.innerWidth * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${height}px`;

      const ctx = canvas.getContext("2d");
      if (ctx) ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const isInitialLoad = animRef.current.isInitialLoad && nodes.length > 0;
    const viewModeChanged = prevViewModeRef.current !== viewMode;

    animRef.current.viewModeChanged = viewModeChanged;
    animRef.current.prevViewMode = prevViewModeRef.current;

    if (isInitialLoad) {
      animRef.current.initialStrokeProgress = 0;
    }

    animRef.current.startTime = performance.now();

    if (viewModeChanged && prevNodesRef.current.length > 0) {
      animRef.current.startNodes = prevNodesRef.current;
    } else {
      animRef.current.startNodes = prevNodesRef.current;
    }

    animRef.current.targetNodes = nodes;
    prevViewModeRef.current = viewMode;
    prevNodesRef.current = nodes;

    const render = (timestamp: number) => {
      const ctx = canvas.getContext("2d");
      if (
        !ctx ||
        !animRef.current.startTime ||
        !animRef.current.startNodes ||
        !animRef.current.targetNodes
      )
        return;

      const elapsed = timestamp - animRef.current.startTime;
      const isInitialLoad =
        animRef.current.isInitialLoad &&
        animRef.current.initialStrokeProgress < 1;

      let strokeProgress = 1;
      if (isInitialLoad) {
        const strokeDuration = 200;
        const strokeElapsed = Math.min(elapsed, strokeDuration);
        const strokeEase = (strokeElapsed / strokeDuration) ** 2;
        strokeProgress = strokeEase;
        animRef.current.initialStrokeProgress = strokeProgress;
      }

      const duration = 700;
      const progress = Math.min(elapsed / duration, 1);
      const ease = easeInOutCubic(progress);

      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

      ctx.beginPath();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1;

      if (isInitialLoad) {
        ctx.globalAlpha = strokeProgress;
      }

      for (let i = 0; i < nodes.length - 1; i++) {
        const startNodeStart = animRef.current.startNodes[i] || nodes[i];
        const nextNodeStart = animRef.current.startNodes[i + 1] || nodes[i + 1];
        const startNodeTarget = animRef.current.targetNodes[i];
        const nextNodeTarget = animRef.current.targetNodes[i + 1];

        if (
          startNodeStart.id !== startNodeTarget.id ||
          nextNodeStart.id !== nextNodeTarget.id
        ) {
          const x1 =
            viewMode === "network"
              ? startNodeTarget.networkX
              : startNodeTarget.calendarX;
          const y1 =
            viewMode === "network"
              ? startNodeTarget.networkY
              : startNodeTarget.calendarY;
          const x2 =
            viewMode === "network"
              ? nextNodeTarget.networkX
              : nextNodeTarget.calendarX;
          const y2 =
            viewMode === "network"
              ? nextNodeTarget.networkY
              : nextNodeTarget.calendarY;

          const seed = (parseInt(startNodeTarget.id) || 0) * 0.1;
          ctx.moveTo(x1, y1);
          drawRoughCurve(ctx, x1, y1, x2, y2, seed, 20);
          continue;
        }

        let currentX1, currentY1, currentX2, currentY2;

        if (animRef.current.viewModeChanged) {
          const prevX1 =
            animRef.current.prevViewMode === "network"
              ? startNodeStart.networkX
              : startNodeStart.calendarX;
          const prevY1 =
            animRef.current.prevViewMode === "network"
              ? startNodeStart.networkY
              : startNodeStart.calendarY;
          const prevX2 =
            animRef.current.prevViewMode === "network"
              ? nextNodeStart.networkX
              : nextNodeStart.calendarX;
          const prevY2 =
            animRef.current.prevViewMode === "network"
              ? nextNodeStart.networkY
              : nextNodeStart.calendarY;

          const currX1 =
            viewMode === "network"
              ? startNodeTarget.networkX
              : startNodeTarget.calendarX;
          const currY1 =
            viewMode === "network"
              ? startNodeTarget.networkY
              : startNodeTarget.calendarY;
          const currX2 =
            viewMode === "network"
              ? nextNodeTarget.networkX
              : nextNodeTarget.calendarX;
          const currY2 =
            viewMode === "network"
              ? nextNodeTarget.networkY
              : nextNodeTarget.calendarY;

          currentX1 = prevX1 + (currX1 - prevX1) * ease;
          currentY1 = prevY1 + (currY1 - prevY1) * ease;
          currentX2 = prevX2 + (currX2 - prevX2) * ease;
          currentY2 = prevY2 + (currY2 - prevY2) * ease;
        } else if (viewMode === "network") {
          currentX1 =
            startNodeTarget.calendarX +
            (startNodeTarget.networkX - startNodeTarget.calendarX) * ease;
          currentY1 =
            startNodeTarget.calendarY +
            (startNodeTarget.networkY - startNodeTarget.calendarY) * ease;
          const nextNode = nodes[i + 1];
          currentX2 =
            nextNode.calendarX +
            (nextNode.networkX - nextNode.calendarX) * ease;
          currentY2 =
            nextNode.calendarY +
            (nextNode.networkY - nextNode.calendarY) * ease;
        } else {
          currentX1 =
            startNodeTarget.networkX +
            (startNodeTarget.calendarX - startNodeTarget.networkX) * ease;
          currentY1 =
            startNodeTarget.networkY +
            (startNodeTarget.calendarY - startNodeTarget.networkY) * ease;
          const nextNode = nodes[i + 1];
          currentX2 =
            nextNode.networkX + (nextNode.calendarX - nextNode.networkX) * ease;
          currentY2 =
            nextNode.networkY + (nextNode.calendarY - nextNode.networkY) * ease;
        }

        const seed = (parseInt(startNodeTarget.id) || 0) * 0.1;
        ctx.moveTo(currentX1, currentY1);
        drawRoughCurve(
          ctx,
          currentX1,
          currentY1,
          currentX2,
          currentY2,
          seed,
          3
        );
      }
      ctx.stroke();

      ctx.globalAlpha = 1;

      const isComplete =
        progress >= 1 && (!isInitialLoad || strokeProgress >= 1);

      if (!isComplete) {
        animRef.current.animationFrameId = requestAnimationFrame(render);
      } else {
        if (animRef.current.isInitialLoad && onAnimationComplete) {
          animRef.current.isInitialLoad = false;
          setTimeout(() => {
            onAnimationComplete();
          }, 0);
        }
      }
    };

    animRef.current.animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animRef.current.animationFrameId) {
        cancelAnimationFrame(animRef.current.animationFrameId);
      }
    };
  }, [nodes, viewMode, onAnimationComplete]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full pointer-events-none transition-opacity duration-700"
      style={{zIndex: 1}}
    />
  );
}

// --- Main Page Component ---

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<DateNode[]>([]);
  const [viewMode, setViewMode] = useState<"network" | "calendar">("network");
  const [showDateTexts, setShowDateTexts] = useState(false);

  const [navPosition, setNavPosition] = useState<{x: number; y: number}>({
    x: 32,
    y: 32,
  });

  const sortedEntries = useMemo(() => {
    return [...dummyDiaryEntries].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, []);

  const entriesByMonth = useMemo(() => {
    const map = new Map<string, typeof sortedEntries>();
    sortedEntries.forEach((entry) => {
      const date = new Date(entry.date);
      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;
      if (!map.has(monthKey)) {
        map.set(monthKey, []);
      }
      map.get(monthKey)!.push(entry);
    });
    return map;
  }, [sortedEntries]);

  useEffect(() => {
    const generateAllPositions = () => {
      if (typeof window === "undefined") return [];

      const padding = 100;
      const width = window.innerWidth - padding * 2;
      const vh = window.innerHeight;

      const cols = window.innerWidth >= 768 ? 3 : 2;
      const gridGap = window.innerWidth >= 768 ? 8 : 16;
      const containerPadding = window.innerWidth >= 768 ? 200 : 32;
      const availableWidth = window.innerWidth - containerPadding * 2;
      const squareSize = (availableWidth - gridGap * (cols - 1)) / cols;

      const newNodes: DateNode[] = [];

      Array.from(entriesByMonth.entries()).forEach(
        ([, entries], monthIndex) => {
          entries.forEach((entry) => {
            const networkX = padding + Math.random() * width;
            const networkY =
              monthIndex * vh + padding + Math.random() * (vh - padding * 2);

            const row = Math.floor(monthIndex / cols);
            const col = monthIndex % cols;
            const squareLeft = containerPadding + col * (squareSize + gridGap);
            const squareTop = 128 + 64 + row * (squareSize + gridGap);

            const randomX = (20 + Math.random() * 60) / 100;
            const randomY = (20 + Math.random() * 60) / 100;
            const calendarX = squareLeft + randomX * squareSize;
            const calendarY = squareTop + randomY * squareSize;

            newNodes.push({
              id: entry.id,
              date: entry.date,
              displayDate: formatDateDisplay(entry.date),
              monthIndex,
              networkX,
              networkY,
              calendarX,
              calendarY,
              thumbnailUrl: entry.thumbnailUrl,
            });
          });
        }
      );

      return newNodes;
    };

    const initialFrame = requestAnimationFrame(() => {
      setNodes(generateAllPositions());
    });

    const handleResize = () => {
      setNodes(generateAllPositions());
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(initialFrame);
    };
  }, [entriesByMonth]);

  useEffect(() => {
    const navWidth = 100;
    const navHeight = 50;

    const setRandomPositions = () => {
      const navX =
        Math.random() * Math.max(0, window.innerWidth - navWidth - 64) + 32;
      const navY =
        Math.random() * Math.max(0, window.innerHeight - navHeight - 64) + 32;
      setNavPosition({x: navX, y: navY});
    };
    requestAnimationFrame(setRandomPositions);
  }, []);

  const totalMonths = entriesByMonth.size;
  const networkHeight = totalMonths * 100;

  const handleAnimationComplete = useCallback(() => {
    setShowDateTexts(true);
  }, []);

  return (
    <div
      className=" relative transition-all duration-700"
      style={{
        height: viewMode === "network" ? `${networkHeight}vh` : "auto",
        minHeight: "100vh",
      }}
    >
      <nav
        className="fixed z-50 flex items-center gap-4 mix-blend-difference"
        style={{
          left: `${navPosition.x}px`,
          top: `${navPosition.y}px`,
        }}
      >
        <button
          onClick={() =>
            setViewMode(viewMode === "network" ? "calendar" : "network")
          }
          className="group relative flex items-center justify-center text-zinc-400 hover:text-blue-300 transition-colors"
        >
          <div className="w-8 h-8 rounded-full border border-current flex items-center justify-center">
            <span className="text-sm">
              {viewMode === "network" ? "狭" : "広"}
            </span>
          </div>
          <span
            className="absolute top-full mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xs whitespace-nowrap"
            style={{writingMode: "vertical-rl"}}
          >
            く並べる
          </span>
        </button>
        <Link
          href="/statement"
          className="group relative flex items-center justify-center text-zinc-400 hover:text-blue-300 transition-colors"
        >
          <div className="w-8 h-8 rounded-full border border-current flex items-center justify-center">
            <span className="text-sm">ス</span>
          </div>
          <span
            className="absolute top-full mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xs whitespace-nowrap"
            style={{writingMode: "vertical-rl"}}
          >
            テートメント
          </span>
        </Link>
      </nav>

      <ConnectingLines
        nodes={nodes}
        viewMode={viewMode}
        onAnimationComplete={handleAnimationComplete}
      />

      {viewMode === "network" &&
        Array.from(entriesByMonth.entries()).map(
          ([monthKey, _], monthIndex) => {
            const [year, month] = monthKey.split("-");
            return (
              <div
                key={monthKey}
                className="absolute left-1/2 -translate-x-1/2 pointer-events-none transition-opacity duration-700 ease-in-out"
                style={{
                  top: `${monthIndex * 100 + 50}vh`,
                  transform: "translate(-50%, -50%)",
                  zIndex: 1,
                }}
              >
                <div
                  className="text-white text-sm"
                  style={{fontFamily: "var(--font-doto)"}}
                >
                  {year}/{month}
                </div>
              </div>
            );
          }
        )}

      <div
        ref={containerRef}
        className="pt-32 pb-16 px-8 md:px-48 relative pointer-events-none"
      >
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-2">
          {Array.from(entriesByMonth.entries()).map(([monthKey, _]) => {
            const [year, month] = monthKey.split("-");
            return (
              <div key={monthKey} className="aspect-square relative">
                <div
                  className={`absolute top-2 left-2 text-xs text-white z-10 transition-opacity duration-700 ease-in-out ${
                    viewMode === "calendar" ? "opacity-100" : "opacity-0"
                  }`}
                  style={{fontFamily: "var(--font-doto)"}}
                >
                  {year}/{month}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div
        className="absolute top-0 left-0 w-full"
        style={{height: "100%", zIndex: 2}}
      >
        {nodes.map((node) => {
          const x = viewMode === "network" ? node.networkX : node.calendarX;
          const y = viewMode === "network" ? node.networkY : node.calendarY;
          const fontSize = viewMode === "network" ? "2rem" : "1.5rem";

          // transformを使って移動させることでパフォーマンスとアニメーションを改善
          // 座標移動とセンタリングを同時に行う
          return (
            <Link
              key={node.id}
              href={`/diary/${node.id}`}
              className="absolute group"
              style={{
                left: 0,
                top: 0,
                transform: `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`,
                opacity: showDateTexts ? 1 : 0,
                // Transitionに 'transform' (位置) を明示的に含める
                // EasingをCanvasの動き(easeInOutCubic)に近づける
                transition: showDateTexts
                  ? `opacity 300ms ease-in-out, transform 700ms ${CSS_EASE_CUBIC}, font-size 700ms ${CSS_EASE_CUBIC}, line-height 700ms ${CSS_EASE_CUBIC}`
                  : "opacity 0ms",
                willChange: "transform, font-size",
              }}
            >
              <div
                className="font-bold whitespace-pre-line cursor-pointer text-center relative"
                style={{
                  fontSize,
                  lineHeight: fontSize,
                  fontFamily: "var(--font-doto)",
                  // 親のLinkにもtransitionがあるが、ここでもfont-sizeの補間を確実にする
                  transition: `font-size 700ms ${CSS_EASE_CUBIC}, line-height 700ms ${CSS_EASE_CUBIC}`,
                }}
              >
                {node.displayDate}
                <div
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-500 pointer-events-none group-hover:scale-100 scale-0 transition-transform duration-300 ease-in-out"
                  style={{
                    width: "1rem",
                    height: "1rem",
                  }}
                />
                {node.thumbnailUrl && (
                  <div
                    className="absolute left-1/2 -translate-x-1/2 bottom-full mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50"
                    style={{
                      width: "200px",
                      aspectRatio: "2/3",
                    }}
                  >
                    <Image
                      src={node.thumbnailUrl}
                      alt=""
                      width={200}
                      height={300}
                      className="w-full h-full object-cover shadow-lg"
                      unoptimized
                    />
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
