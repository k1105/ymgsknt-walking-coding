"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useMemo,
  ReactNode,
} from "react";
import {useRouter, usePathname} from "next/navigation";
import {DiaryEntry} from "@/lib/types";
import Link from "next/link";
import {setupCanvas, drawRoughCurve} from "@/lib/canvas";

// --- Types & Context ---
interface DiaryContextType {
  setEntryData: (data: {
    current: DiaryEntry;
    prev: DiaryEntry | null;
    next: DiaryEntry | null;
    prevPrev: DiaryEntry | null;
    nextNext: DiaryEntry | null;
  }) => void;
  triggerTransition: (direction: "next" | "prev", url: string) => void;
}

const DiaryContext = createContext<DiaryContextType | null>(null);

export function useDiaryFrame() {
  const context = useContext(DiaryContext);
  if (!context) throw new Error("useDiaryFrame must be used within DiaryFrame");
  return context;
}

// --- Helper ---
function formatDateDisplay(dateStr: string) {
  const date = new Date(dateStr);
  const year = String(date.getFullYear()).slice(-2).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}\n${month}\n${day}`;
}

// --- Component ---
export default function DiaryFrame({children}: {children: ReactNode}) {
  const router = useRouter();
  const pathname = usePathname();
  const isRootPage = pathname === "/";
  const titleCanvasRef = useRef<HTMLCanvasElement>(null);

  // Title characters positions
  const titleText = "Wa●●l●king●Co●ding";
  const titleChars = useMemo(() => titleText.split(""), []);
  const [titleCharPositions, setTitleCharPositions] = useState<
    Array<{char: string; x: number; y: number}>
  >([]);
  const [isMobile, setIsMobile] = useState(false);
  const [windowWidth, setWindowWidth] = useState(0);

  const [entries, setEntries] = useState<{
    current: DiaryEntry | null;
    prev: DiaryEntry | null;
    next: DiaryEntry | null;
    prevPrev: DiaryEntry | null;
    nextNext: DiaryEntry | null;
  }>({current: null, prev: null, next: null, prevPrev: null, nextNext: null});

  const [animatingDir, setAnimatingDir] = useState<"next" | "prev" | null>(
    null
  );
  const [targetUrl, setTargetUrl] = useState<string | null>(null);

  const setEntryData = (data: typeof entries) => {
    setEntries(data);
    setAnimatingDir(null);
    setTargetUrl(null);
  };

  const triggerTransition = (direction: "next" | "prev", url: string) => {
    if (animatingDir) return;
    setTargetUrl(url);
    setAnimatingDir(direction);
  };

  useEffect(() => {
    if (!animatingDir || !targetUrl) return;
    const timer = setTimeout(() => {
      router.push(targetUrl);
    }, 800);
    return () => clearTimeout(timer);
  }, [animatingDir, targetUrl, router]);

  // Check if mobile and window width
  useEffect(() => {
    const checkMobile = () => {
      const width = window.innerWidth;
      setWindowWidth(width);
      setIsMobile(width < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Generate title character positions
  useEffect(() => {
    const generateTitlePositions = () => {
      let width: number;
      let height: number;

      if (isMobile && windowWidth > 0) {
        // スマホ版: 横幅100%、高さは幅の1/4
        width = windowWidth;
        height = width / 4;
      } else if (!isMobile) {
        // PC版: 固定サイズ
        width = 100;
        height = 400;
      } else {
        // 初期レンダリング時はスキップ
        return;
      }

      const padding = 10;
      const rangeX = width - padding * 2;
      const rangeY = height - padding * 2;
      const centerY = height / 2;

      if (isMobile) {
        // スマホ版: 横方向に順序を守って並べる
        const minSpacing = (width / titleChars.length) * 0.3;
        const maxSpacing = (width / titleChars.length) * 0.5;
        const spacings: number[] = [];
        for (let i = 0; i < titleChars.length; i++) {
          spacings.push(minSpacing + Math.random() * (maxSpacing - minSpacing));
        }

        const positions = titleChars.map((char, index) => {
          // 最初の文字（W）は左上
          if (index === 0) {
            return {
              char,
              x: padding,
              y: padding + Math.random() * (rangeY * 0.3),
            };
          }
          // C（index 8）は中央横位置、縦はランダム
          if (index === 8) {
            return {char, x: width / 2, y: padding + Math.random() * rangeY};
          }
          // 最後の文字（g）は右下
          if (index === titleChars.length - 1) {
            return {
              char,
              x: width - padding,
              y: height - padding - Math.random() * (rangeY * 0.3),
            };
          }

          // 横方向: 前の文字から順に右へ進む（ランダムな間隔）
          let currentX = padding;
          for (let i = 1; i <= index; i++) {
            currentX += spacings[i];
          }
          // 中央を超えないように調整
          if (index < 8) {
            currentX = Math.min(currentX, width / 2 - padding);
          } else {
            // C以降はCの位置から開始
            currentX = width / 2 + (currentX - width / 2);
            currentX = Math.min(currentX, width - padding);
          }

          // 縦方向: ランダム（ただし範囲内）
          const y = padding + Math.random() * rangeY;

          return {
            char,
            x: Math.max(padding, Math.min(width - padding, currentX)),
            y: Math.max(padding, Math.min(height - padding, y)),
          };
        });
        setTitleCharPositions(positions);
      } else {
        // PC版: 縦方向に順序を守って並べる（既存のロジック）
        const minSpacing = 20;
        const maxSpacing = 35;
        const spacings: number[] = [];
        for (let i = 0; i < titleChars.length; i++) {
          spacings.push(minSpacing + Math.random() * (maxSpacing - minSpacing));
        }
        const positions = titleChars.map((char, index) => {
          if (index === 0) return {char, x: padding, y: padding};
          if (index === 8) return {char, x: width / 2, y: centerY};
          if (index === titleChars.length - 1)
            return {char, x: width - padding, y: height - padding};
          const random1 = Math.random();
          const seed1 = index * 0.618 + random1 * 100;
          const x = (Math.sin(seed1) * 0.5 + 0.5) * rangeX + padding;
          let y;
          if (index < 8) {
            let currentY = padding;
            for (let i = 1; i <= index; i++) currentY += spacings[i];
            y = Math.min(currentY, centerY - padding);
          } else {
            let currentY = centerY;
            for (let i = 9; i <= index; i++) currentY += spacings[i];
            y = Math.min(currentY, height - padding);
          }
          return {
            char,
            x: Math.max(padding, Math.min(width - padding, x)),
            y: Math.max(padding, Math.min(height - padding, y)),
          };
        });
        setTitleCharPositions(positions);
      }
    };
    generateTitlePositions();
  }, [titleChars, isMobile, windowWidth]);

  // Draw connecting lines for title
  useEffect(() => {
    const canvas = titleCanvasRef.current;
    if (!canvas || titleCharPositions.length === 0) return;

    let width: number;
    let height: number;

    if (isMobile && windowWidth > 0) {
      width = windowWidth;
      height = width / 4;
    } else if (!isMobile) {
      width = 100;
      height = 400;
    } else {
      return;
    }

    const ctx = setupCanvas(canvas, width, height);
    if (!ctx) return;
    ctx.beginPath();
    ctx.strokeStyle = "#f97316"; // orange-500
    ctx.lineWidth = 1;
    for (let i = 0; i < titleCharPositions.length - 1; i++) {
      const current = titleCharPositions[i];
      const next = titleCharPositions[i + 1];
      if (i === 0) ctx.moveTo(current.x, current.y);
      const seed = i * 0.1;
      drawRoughCurve(ctx, current.x, current.y, next.x, next.y, seed, 1);
    }
    ctx.stroke();
  }, [titleCharPositions, isMobile, windowWidth]);

  // 定位置の定義
  // BC_LEFT / BC_RIGHT は使用せず、BL/BR/BCをターゲットにします
  const POSITIONS = {
    TL: "translate3d(2rem, 2rem, 0)",
    BL: "translate3d(2rem, calc(100dvh - 100% - 2rem), 0)",
    BR: "translate3d(calc(100vw - 100% - 2rem), calc(100dvh - 100% - 2rem), 0)",
    BC: "translate3d(calc(50vw - 50%), calc(100dvh - 100% - 2rem), 0)",
    OFF_LEFT: "translate3d(-100%, calc(100dvh - 100% - 2rem), 0)",
    OFF_RIGHT: "translate3d(100vw, calc(100dvh - 100% - 2rem), 0)",
  };

  const getDateStyles = (
    role: "prevprev" | "prev" | "current" | "next" | "nextnext"
  ) => {
    let targetPosition: keyof typeof POSITIONS = "OFF_LEFT";
    let opacity = 1;
    let fontSize = "1.5rem";
    let color = "rgb(161 161 170)"; // zinc-400
    const activeColor = "rgb(37 99 235)"; // blue-600
    let cursor = "default";
    let pointerEvents: "auto" | "none" = "auto";

    // --- ロジック修正: 移動先を「遷移後の役割の定位置」に厳密に合わせる ---

    if (animatingDir === "next") {
      // 次へ進む: 全体が左へシフト
      switch (role) {
        case "prev":
          targetPosition = "OFF_LEFT"; // 画面外へ
          opacity = 0;
          break;
        case "current":
          targetPosition = "BL"; // Current -> 次の Prev 位置へ
          opacity = 0.7;
          fontSize = "1.5rem";
          break;
        case "next":
          targetPosition = "BC"; // Next -> 次の Current 位置へ
          opacity = 1;
          fontSize = "2rem";
          color = activeColor;
          break;
        case "nextnext":
          targetPosition = "BR"; // NextNext -> 次の Next 位置へ
          opacity = 0.7;
          fontSize = "1.5rem";
          break;
        default:
          opacity = 0;
      }
    } else if (animatingDir === "prev") {
      // 前へ戻る: 全体が右へシフト
      switch (role) {
        case "prevprev":
          targetPosition = "BL"; // PrevPrev -> 次の Prev 位置へ
          opacity = 0.7;
          fontSize = "1.5rem";
          break;
        case "prev":
          targetPosition = "BC"; // Prev -> 次の Current 位置へ
          opacity = 1;
          fontSize = "2rem";
          color = activeColor;
          break;
        case "current":
          targetPosition = "BR"; // Current -> 次の Next 位置へ
          opacity = 0.7;
          fontSize = "1.5rem";
          break;
        case "next":
          targetPosition = "OFF_RIGHT"; // 画面外へ
          opacity = 0;
          break;
        default:
          opacity = 0;
      }
    } else {
      // アイドル状態 (通常配置)
      switch (role) {
        case "prevprev":
          targetPosition = "OFF_LEFT";
          opacity = 0;
          pointerEvents = "none";
          break;
        case "prev":
          targetPosition = "BL";
          opacity = 0.7;
          cursor = "pointer";
          break;
        case "current":
          targetPosition = "BC";
          opacity = 1;
          fontSize = "2rem";
          color = activeColor;
          break;
        case "next":
          targetPosition = "BR";
          opacity = 0.7;
          cursor = "pointer";
          break;
        case "nextnext":
          targetPosition = "OFF_RIGHT";
          opacity = 0;
          pointerEvents = "none";
          break;
      }
    }

    if (animatingDir) pointerEvents = "none";

    // ターゲットが中央かどうかでスタイル起点を変える（モーフィングを自然にするため）
    // transition-allにより、text-alignの変更は即時適用されるが、
    // transform移動とoriginの変更で視覚的なズレを最小限にする
    const isTargetCenter = targetPosition === "BC";

    const baseClassName = `fixed top-0 left-0 font-bold whitespace-pre-line transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] z-50 select-none border-0 bg-transparent p-0 m-0 ${
      isTargetCenter
        ? "origin-bottom-center text-center"
        : "origin-bottom-left text-left"
    }`;

    return {
      className: baseClassName,
      style: {
        transform: POSITIONS[targetPosition],
        opacity,
        fontSize,
        lineHeight: fontSize,
        color,
        cursor,
        pointerEvents,
        fontFamily: "var(--font-doto)",
      },
      onClick: () => {
        if (animatingDir) return;
        if (role === "prev" && entries.prev)
          triggerTransition("prev", `/diary/${entries.prev.id}`);
        if (role === "next" && entries.next)
          triggerTransition("next", `/diary/${entries.next.id}`);
      },
    };
  };

  return (
    <DiaryContext.Provider value={{setEntryData, triggerTransition}}>
      {/* Title Block */}
      <header
        className={`fixed z-50 ${
          isMobile
            ? "bottom-0 left-0 w-full"
            : "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        }`}
      >
        <div
          className="relative"
          style={
            isMobile && windowWidth > 0
              ? {
                  width: "100%",
                  height: `${windowWidth / 4}px`,
                }
              : {width: "100px", height: "400px"}
          }
        >
          <canvas
            ref={titleCanvasRef}
            className="absolute top-0 left-0 pointer-events-none"
            style={
              isMobile && windowWidth > 0
                ? {
                    width: "100%",
                    height: `${windowWidth / 4}px`,
                  }
                : {width: "100px", height: "400px"}
            }
          />
          {titleCharPositions.map((pos, index) => (
            <span
              key={index}
              className="absolute text-orange-500"
              style={{
                fontSize: isMobile ? "2rem" : "1.75rem",
                left: `${pos.x}px`,
                top: `${pos.y}px`,
                transform: "translate(-50%, -50%)",
              }}
            >
              {pos.char === " " ? "\u00A0" : pos.char}
            </span>
          ))}
        </div>
      </header>

      {!isRootPage && (
        <>
          <Link
            href="/"
            className={`fixed top-8 right-8 z-[60] w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-white transition-all duration-700 delay-300`}
            aria-label="Back to index"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </Link>

          {/* Date Elements */}
          {entries.prevPrev && (
            <div key={entries.prevPrev.id} {...getDateStyles("prevprev")}>
              {formatDateDisplay(entries.prevPrev.date)}
            </div>
          )}
          {entries.prev && (
            <div key={entries.prev.id} {...getDateStyles("prev")}>
              {formatDateDisplay(entries.prev.date)}
            </div>
          )}
          {entries.current && (
            <div key={entries.current.id} {...getDateStyles("current")}>
              {formatDateDisplay(entries.current.date)}
            </div>
          )}
          {entries.next && (
            <div key={entries.next.id} {...getDateStyles("next")}>
              {formatDateDisplay(entries.next.date)}
            </div>
          )}
          {entries.nextNext && (
            <div key={entries.nextNext.id} {...getDateStyles("nextnext")}>
              {formatDateDisplay(entries.nextNext.date)}
            </div>
          )}
        </>
      )}

      <div
        className={`transition-opacity duration-700 ease-in-out will-change-[opacity] ${
          isRootPage || !animatingDir ? "opacity-100" : "opacity-0"
        }`}
      >
        {children}
      </div>
    </DiaryContext.Provider>
  );
}
