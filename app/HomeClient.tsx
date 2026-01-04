"use client";

import Link from "next/link";
import Image from "next/image";
import {useEffect, useRef, useState, useMemo, useCallback} from "react";
import {DiaryEntry} from "@/lib/types";
import {drawRoughCurve} from "@/lib/canvas";

// --- Constants & Config ---
const LAYOUT_CONFIG = {
  // Network View Settings
  networkPadding: 100,
  monthVh: 100, // 1ヶ月あたりの高さ(vh)

  // Calendar View Settings (Grid)
  gridColsMd: 3,
  gridColsSm: 1,
  gridGap: 8, // px
  paddingX_Md: 192, // px
  paddingX_Sm: 32, // px
  paddingTop: 192, // px (Nav area etc)
  paddingBottom: 64, // px
  // 元のロジックに合わせて調整: マス内でのランダム範囲 (20%~80%)
  squareRandomMin: 0.2,
  squareRandomMax: 0.8,
};

const TRANSITION_DURATION = 700;
const CSS_EASE_CUBIC = "cubic-bezier(0.65, 0, 0.35, 1)";

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

interface LayoutState {
  nodes: DateNode[];
  networkHeight: number;
  calendarHeight: number;
}

// --- Helpers ---
function formatDateDisplay(dateStr: string) {
  const date = new Date(dateStr);
  const year = String(date.getFullYear()).slice(-2).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}/${month}/${day}`;
}

function easeInOutCubic(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

// --- Custom Hook: Layout & Logic ---
function useDiaryLayout(entries: DiaryEntry[]) {
  const [layout, setLayout] = useState<LayoutState>({
    nodes: [],
    networkHeight: 0,
    calendarHeight: 0,
  });

  // 初回計算済みのノード位置を保存（再計算を防ぐため）
  const fixedNodesRef = useRef<DateNode[] | null>(null);

  const sortedEntries = useMemo(() => {
    return [...entries].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [entries]);

  const entriesByMonth = useMemo(() => {
    const map = new Map<string, DiaryEntry[]>();
    sortedEntries.forEach((entry) => {
      const date = new Date(entry.date);
      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;
      if (!map.has(monthKey)) map.set(monthKey, []);
      map.get(monthKey)!.push(entry);
    });
    return map;
  }, [sortedEntries]);

  useEffect(() => {
    // 既に計算済みの場合は位置を再計算せず、高さのみ更新
    if (fixedNodesRef.current !== null) {
      const calculateHeights = () => {
        if (typeof window === "undefined") return;
        const {innerHeight} = window;
        const {paddingBottom} = LAYOUT_CONFIG;

        const totalMonths = entriesByMonth.size;
        const networkTotalHeight = totalMonths * innerHeight;

        // Calendar heightの計算（既存のノードから最大Yを取得）
        let maxCalendarY = 0;
        fixedNodesRef.current!.forEach((node) => {
          if (node.calendarY > maxCalendarY) {
            maxCalendarY = node.calendarY;
          }
        });

        setLayout({
          nodes: fixedNodesRef.current!,
          networkHeight: networkTotalHeight,
          calendarHeight: maxCalendarY + paddingBottom,
        });
      };

      calculateHeights();
      window.addEventListener("resize", calculateHeights);
      return () => window.removeEventListener("resize", calculateHeights);
    }

    // 初回計算のみ実行
    const calculateLayout = () => {
      if (typeof window === "undefined") return;

      const {innerWidth, innerHeight} = window;
      const {
        networkPadding,
        gridColsMd,
        gridColsSm,
        gridGap,
        paddingX_Md,
        paddingX_Sm,
        paddingTop,
        paddingBottom,
      } = LAYOUT_CONFIG;

      // Calculate Grid Metrics
      const isMd = innerWidth >= 768;
      const cols = isMd ? gridColsMd : gridColsSm;
      const containerPadding = isMd ? paddingX_Md : paddingX_Sm;
      const availableWidth = innerWidth - containerPadding * 2;
      const totalGapWidth = gridGap * (cols - 1);
      const squareSize = (availableWidth - totalGapWidth) / cols;

      const newNodes: DateNode[] = [];
      let maxCalendarY = 0;

      // Network View Total Height
      const totalMonths = entriesByMonth.size;
      const networkTotalHeight = totalMonths * innerHeight;

      Array.from(entriesByMonth.entries()).forEach(
        ([, monthEntries], monthIndex) => {
          // --- Grid Position Calculation (Per Month) ---
          // 元のロジック: 月ごとにGridのマスを決める
          const row = Math.floor(monthIndex / cols);
          const col = monthIndex % cols;

          const squareLeft = containerPadding + col * (squareSize + gridGap);
          const squareTop = paddingTop + row * (squareSize + gridGap);

          // Gridの高さを更新（列の底辺）
          const thisSquareBottom = squareTop + squareSize;
          if (thisSquareBottom > maxCalendarY) {
            maxCalendarY = thisSquareBottom;
          }

          monthEntries.forEach((entry) => {
            // --- Network Coordinates ---
            const networkX =
              networkPadding +
              Math.random() * (innerWidth - networkPadding * 2);
            const networkY =
              monthIndex * innerHeight +
              networkPadding +
              Math.random() * (innerHeight - networkPadding * 2);

            // --- Calendar Coordinates ---
            // 元のロジック: マスの中で 20%~80% の位置にランダム配置
            const randomX = 0.2 + Math.random() * 0.6; // 0.2 ~ 0.8
            const randomY = 0.2 + Math.random() * 0.6; // 0.2 ~ 0.8

            const squareRight = squareLeft + squareSize;
            const maxX = Math.min(squareRight, innerWidth - containerPadding);

            const calendarX = Math.min(squareLeft + randomX * squareSize, maxX);
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

      // 初回計算結果を保存
      fixedNodesRef.current = newNodes;

      setLayout({
        nodes: newNodes,
        networkHeight: networkTotalHeight,
        calendarHeight: maxCalendarY + paddingBottom,
      });
    };

    calculateLayout();
    // 初回計算後はリサイズイベントを登録しない（位置は固定）
  }, [entriesByMonth]);

  return {entriesByMonth, ...layout};
}

// --- Component: Background Canvas ---
function ConnectingLines({
  nodes,
  viewMode,
  containerHeight,
  onAnimationComplete,
}: {
  nodes: DateNode[];
  viewMode: "network" | "calendar";
  containerHeight: number;
  onAnimationComplete?: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
  const prevViewModeRef = useRef(viewMode);

  // Resize Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = containerHeight * dpr;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${containerHeight}px`;

    const ctx = canvas.getContext("2d");
    if (ctx) ctx.scale(dpr, dpr);
  }, [containerHeight]);

  // Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || nodes.length === 0) return;

    const dpr = window.devicePixelRatio || 1;
    const viewModeChanged = prevViewModeRef.current !== viewMode;

    animRef.current.viewModeChanged = viewModeChanged;
    animRef.current.prevViewMode = prevViewModeRef.current;

    if (animRef.current.isInitialLoad) {
      animRef.current.initialStrokeProgress = 0;
    }

    animRef.current.startTime = performance.now();
    animRef.current.startNodes = prevNodesRef.current;
    animRef.current.targetNodes = nodes;

    prevViewModeRef.current = viewMode;
    prevNodesRef.current = nodes;

    const render = (timestamp: number) => {
      const ctx = canvas.getContext("2d");
      if (!ctx || !animRef.current.startTime || !animRef.current.targetNodes)
        return;

      const elapsed = timestamp - animRef.current.startTime;
      const isInitialLoad =
        animRef.current.isInitialLoad &&
        animRef.current.initialStrokeProgress < 1;

      // Stroke drawing animation for initial load
      let strokeProgress = 1;
      if (isInitialLoad) {
        const strokeDuration = 200;
        strokeProgress = Math.min(elapsed / strokeDuration, 1) ** 2;
        animRef.current.initialStrokeProgress = strokeProgress;
      }

      // Morphing animation
      const progress = Math.min(elapsed / TRANSITION_DURATION, 1);
      const ease = easeInOutCubic(progress);

      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
      ctx.beginPath();
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 1;

      if (isInitialLoad) ctx.globalAlpha = strokeProgress;

      const currentNodes = animRef.current.targetNodes;
      const startNodes = animRef.current.startNodes || currentNodes;

      for (let i = 0; i < currentNodes.length - 1; i++) {
        const getInterpolatedPos = (
          nodeStart: DateNode | undefined,
          nodeTarget: DateNode
        ) => {
          if (!nodeStart || nodeStart.id !== nodeTarget.id) {
            return {
              x:
                viewMode === "network"
                  ? nodeTarget.networkX
                  : nodeTarget.calendarX,
              y:
                viewMode === "network"
                  ? nodeTarget.networkY
                  : nodeTarget.calendarY,
            };
          }

          const startX =
            animRef.current.prevViewMode === "network"
              ? nodeStart.networkX
              : nodeStart.calendarX;
          const startY =
            animRef.current.prevViewMode === "network"
              ? nodeStart.networkY
              : nodeStart.calendarY;
          const targetX =
            viewMode === "network" ? nodeTarget.networkX : nodeTarget.calendarX;
          const targetY =
            viewMode === "network" ? nodeTarget.networkY : nodeTarget.calendarY;

          return {
            x: startX + (targetX - startX) * ease,
            y: startY + (targetY - startY) * ease,
          };
        };

        const p1 = getInterpolatedPos(startNodes[i], currentNodes[i]);
        const p2 = getInterpolatedPos(startNodes[i + 1], currentNodes[i + 1]);

        const seed = (parseInt(currentNodes[i].id) || 0) * 0.1;
        ctx.moveTo(p1.x, p1.y);
        drawRoughCurve(ctx, p1.x, p1.y, p2.x, p2.y, seed, 3);
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
          setTimeout(onAnimationComplete, 0);
        }
      }
    };

    const animationFrameId = requestAnimationFrame(render);
    animRef.current.animationFrameId = animationFrameId;

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [nodes, viewMode, onAnimationComplete, containerHeight]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full pointer-events-none transition-opacity duration-700"
      style={{zIndex: 1}}
    />
  );
}

// --- Main Page Component ---
interface HomeClientProps {
  entries: DiaryEntry[];
}

export default function HomeClient({entries}: HomeClientProps) {
  const [viewMode, setViewMode] = useState<"network" | "calendar">("network");
  const [showDateTexts, setShowDateTexts] = useState(false);

  // Use Custom Hook logic
  const {entriesByMonth, nodes, networkHeight, calendarHeight} =
    useDiaryLayout(entries);

  const handleAnimationComplete = useCallback(() => {
    setShowDateTexts(true);
    // Dispatch custom event for DiaryFrame title fade-in
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("diaryTitleFadeIn"));
    }
  }, []);

  // Sync viewMode with DiaryFrame
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("viewModeChange", {detail: viewMode})
      );
    }
  }, [viewMode]);

  // Listen for viewMode changes from DiaryFrame
  useEffect(() => {
    const handleViewModeChange = (e: CustomEvent<"network" | "calendar">) => {
      setViewMode(e.detail);
    };

    window.addEventListener(
      "viewModeChange",
      handleViewModeChange as EventListener
    );
    // Initial sync
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("viewModeChange", {detail: viewMode})
      );
    }
    return () =>
      window.removeEventListener(
        "viewModeChange",
        handleViewModeChange as EventListener
      );
  }, [viewMode]);

  const currentPageHeight =
    viewMode === "network" ? networkHeight : calendarHeight;

  return (
    <div
      className="relative w-full overflow-hidden transition-all ease-in-out"
      style={{
        height: currentPageHeight > 0 ? `${currentPageHeight}px` : "100vh",
        transitionDuration: `${TRANSITION_DURATION}ms`,
      }}
    >
      {/* Canvas Layer */}
      <ConnectingLines
        nodes={nodes}
        viewMode={viewMode}
        containerHeight={currentPageHeight}
        onAnimationComplete={handleAnimationComplete}
      />

      {/* Background Month Labels (Network Mode Only) */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-700"
        style={{opacity: viewMode === "network" ? 1 : 0}}
      >
        {Array.from(entriesByMonth.entries()).map(
          ([monthKey, _], monthIndex) => {
            const [year, month] = monthKey.split("-");
            return (
              <div
                key={monthKey}
                className="absolute left-1/2 -translate-x-1/2"
                style={{
                  top: `${monthIndex * 100 + 50}vh`,
                  transform: "translate(-50%, -50%)",
                  zIndex: 1,
                }}
              >
                <div
                  className="text-gray-900 text-sm"
                  style={{fontFamily: "var(--font-doto)"}}
                >
                  {year}/{month}
                </div>
              </div>
            );
          }
        )}
      </div>

      {/* Calendar Mode Month Labels (Grid Background) */}
      <div
        className="pt-32 pb-16 px-8 md:px-48 relative pointer-events-none transition-opacity duration-700"
        style={{opacity: viewMode === "calendar" ? 1 : 0}}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-2">
          {Array.from(entriesByMonth.entries()).map(([monthKey, _]) => {
            const [year, month] = monthKey.split("-");
            return (
              <div key={monthKey} className="aspect-square relative">
                <div
                  className="absolute top-2 left-2 text-xs text-gray-900 z-10"
                  style={{fontFamily: "var(--font-doto)"}}
                >
                  {year}/{month}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Node Layer */}
      <div className="absolute top-0 left-0 w-full h-full" style={{zIndex: 2}}>
        {nodes.map((node) => {
          const x = viewMode === "network" ? node.networkX : node.calendarX;
          const y = viewMode === "network" ? node.networkY : node.calendarY;
          const fontSize = viewMode === "network" ? "2rem" : "1.5rem";

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
                transition: showDateTexts
                  ? `opacity 300ms ease-in-out, transform ${TRANSITION_DURATION}ms ${CSS_EASE_CUBIC}`
                  : "opacity 0ms",
                willChange: "transform",
              }}
            >
              <div
                className="whitespace-pre-line cursor-pointer text-center relative text-black"
                style={{
                  fontSize,
                  lineHeight: fontSize,
                  transition: `font-size ${TRANSITION_DURATION}ms ${CSS_EASE_CUBIC}, line-height ${TRANSITION_DURATION}ms ${CSS_EASE_CUBIC}`,
                }}
              >
                {node.displayDate}

                {/* Dot Indicator */}
                <div
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gray-500 pointer-events-none group-hover:scale-100 scale-0 transition-transform duration-300 ease-in-out"
                  style={{width: "1rem", height: "1rem"}}
                />

                {/* Thumbnail Popup */}
                {node.thumbnailUrl && (
                  <div
                    className="absolute left-1/2 -translate-x-1/2 bottom-full mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50"
                    style={{width: "200px", aspectRatio: "2/3"}}
                  >
                    <Image
                      src={node.thumbnailUrl}
                      alt=""
                      width={200}
                      height={300}
                      className="w-full h-full object-cover border border-black"
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
