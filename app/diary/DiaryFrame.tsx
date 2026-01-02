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
  const isStatementPage = pathname === "/statement";
  const isDiaryPage = pathname.startsWith("/diary/") && pathname !== "/diary";
  const titleCanvasRef = useRef<HTMLCanvasElement>(null);

  // Title characters positions
  const titleText = "Wa●●l●king●Co●ding";
  const titleChars = useMemo(() => titleText.split(""), []);
  const [titleCharPositions, setTitleCharPositions] = useState<
    Array<{char: string; x: number; y: number}>
  >([]);
  const [isMobile, setIsMobile] = useState(false);
  const [windowWidth, setWindowWidth] = useState(0);
  const [showTitle, setShowTitle] = useState(!isRootPage); // Show immediately if not root page
  const [viewMode, setViewMode] = useState<"network" | "calendar">("network");

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

  // Listen for title fade-in event on root page
  useEffect(() => {
    if (!isRootPage) return;

    const handleTitleFadeIn = () => {
      setShowTitle(true);
    };

    window.addEventListener(
      "diaryTitleFadeIn",
      handleTitleFadeIn as EventListener
    );
    return () =>
      window.removeEventListener(
        "diaryTitleFadeIn",
        handleTitleFadeIn as EventListener
      );
  }, [isRootPage]);

  // Listen for viewMode changes from page.tsx
  useEffect(() => {
    const handleViewModeChange = (e: CustomEvent<"network" | "calendar">) => {
      setViewMode(e.detail);
    };

    window.addEventListener(
      "viewModeChange",
      handleViewModeChange as EventListener
    );
    return () =>
      window.removeEventListener(
        "viewModeChange",
        handleViewModeChange as EventListener
      );
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
        // スマホ版: 横方向に順序を守って、widthに対するパーセンテージで配置
        // 左端と右端の余白をパーセンテージで定義（文字が画面外に出ないように）
        const leftPaddingPercent = 0.05; // 5%
        const rightPaddingPercent = 0.05; // 5%

        // 各文字について、順序を保ちながら利用可能な範囲でランダムに配置
        const positions: Array<{char: string; x: number; y: number}> = [];

        // 各文字について、順序を保ちながら利用可能な範囲全体でランダムに配置
        for (let index = 0; index < titleChars.length; index++) {
          const char = titleChars[index];

          let x: number;

          // 最初の文字（W）は左端に固定
          if (index === 0) {
            x = width * leftPaddingPercent;
          }
          // 最後の文字（g）は右端に固定
          else if (index === titleChars.length - 1) {
            x = width * (1 - rightPaddingPercent);
          }
          // その他の文字はランダム配置
          else {
            // 前の文字より右に配置する必要がある（最小位置をパーセンテージで計算）
            let minPercent = leftPaddingPercent;
            if (positions[index - 1]) {
              // 前の文字の位置（パーセンテージ）+ 少しの間隔
              const prevPercent = positions[index - 1].x / width;
              minPercent = prevPercent + 0.02; // 前の文字より2%右
            }

            // 後の文字のための余白を確保しつつ最大位置をパーセンテージで計算
            const remainingChars = titleChars.length - index - 1;
            const minSpacingPercent = 0.03; // 各文字間の最小間隔3%
            let maxPercent =
              1 - rightPaddingPercent - remainingChars * minSpacingPercent;

            // 最小位置と最大位置が逆転しないように調整
            maxPercent = Math.max(minPercent + 0.02, maxPercent);

            // パーセンテージでランダムな位置を決定
            const xPercent =
              minPercent + Math.random() * (maxPercent - minPercent);
            x = width * xPercent;
          }

          // 縦方向: ランダム（ただし範囲内）
          const y = padding + Math.random() * rangeY;

          positions.push({
            char,
            x,
            y: Math.max(padding, Math.min(height - padding, y)),
          });
        }
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
    ctx.strokeStyle = "#8EC5FF";
    ctx.lineWidth = 1;
    for (let i = 0; i < titleCharPositions.length - 1; i++) {
      const current = titleCharPositions[i];
      const next = titleCharPositions[i + 1];
      // pos.yは上から下の座標系（0が上端）
      // Canvasも上から下の座標系なので、pos.yをそのまま使う
      // 文字はbottom基準で配置されているが、transform: translate(-50%, -50%)により
      // 文字の中心がpos.yの位置になるので、Canvasの描画でもpos.yをそのまま使えば一致する
      if (i === 0) ctx.moveTo(current.x, current.y);
      const seed = i * 0.1;
      drawRoughCurve(ctx, current.x, current.y, next.x, next.y, seed, 1);
    }
    ctx.stroke();
  }, [titleCharPositions, isMobile, windowWidth]);

  // 定位置の定義
  // BC_LEFT / BC_RIGHT は使用せず、BL/BR/BCをターゲットにします
  // PC版では30vwの幅の中で配置（中央から左右に15vwずつ）
  const POSITIONS_BASE = {
    TL: "translate3d(2rem, 5rem, 0)", // closeボタンと重ならないように上から5remに変更
    TR: "translate3d(calc(100vw - 100% - 2rem), 5rem, 0)", // closeボタンと重ならないように上から5remに変更
    TC: "translate3d(calc(50vw - 50%), 5rem, 0)", // closeボタンと重ならないように上から5remに変更
    BL: "translate3d(2rem, calc(100dvh - 100% - 2rem), 0)",
    BR: "translate3d(calc(100vw - 100% - 2rem), calc(100dvh - 100% - 2rem), 0)",
    BC: "translate3d(calc(50vw - 50%), calc(100dvh - 100% - 2rem), 0)",
    OFF_LEFT: "translate3d(-100%, calc(100dvh - 100% - 2rem), 0)",
    OFF_RIGHT: "translate3d(100vw, calc(100dvh - 100% - 2rem), 0)",
    OFF_LEFT_TOP: "translate3d(-100%, 5rem, 0)", // closeボタンと重ならないように上から5remに変更
    OFF_RIGHT_TOP: "translate3d(100vw, 5rem, 0)", // closeボタンと重ならないように上から5remに変更
  };

  const getPositionTransform = (
    position: keyof typeof POSITIONS_BASE
  ): string => {
    const base = POSITIONS_BASE[position];
    if (isMobile) {
      // sp版: そのまま使用
      return base;
    }
    // PC版: 30vw幅内に配置
    switch (position) {
      case "BL":
        return "translate3d(calc(35vw - 50%), calc(100dvh - 100% - 2rem), 0)";
      case "BR":
        return "translate3d(calc(65vw - 50%), calc(100dvh - 100% - 2rem), 0)";
      case "OFF_LEFT":
        return "translate3d(calc(35vw - 50% - 10vw), calc(100dvh - 100% - 2rem), 0)";
      case "OFF_RIGHT":
        return "translate3d(calc(65vw - 50% + 10vw), calc(100dvh - 100% - 2rem), 0)";
      default:
        return base;
    }
  };

  const getDateStyles = (
    role: "prevprev" | "prev" | "current" | "next" | "nextnext"
  ) => {
    let targetPosition: keyof typeof POSITIONS_BASE = "OFF_LEFT";
    let opacity = 1;
    let fontSize = "1.5rem";
    let color = "rgb(161 161 170)"; // zinc-400
    const activeColor = "rgb(255 255 255)"; // blue-600
    let cursor = "default";
    let pointerEvents: "auto" | "none" = "auto";

    // sp版では上部に配置、PC版では下部に配置
    const getPosition = (
      bottomPos: keyof typeof POSITIONS_BASE
    ): keyof typeof POSITIONS_BASE => {
      if (isMobile) {
        // sp版: 下部位置を上部位置にマッピング
        const mapping: Record<string, keyof typeof POSITIONS_BASE> = {
          BL: "TL",
          BR: "TR",
          BC: "TC",
          OFF_LEFT: "OFF_LEFT_TOP",
          OFF_RIGHT: "OFF_RIGHT_TOP",
        };
        return mapping[bottomPos] || bottomPos;
      }
      return bottomPos;
    };

    // --- ロジック修正: 移動先を「遷移後の役割の定位置」に厳密に合わせる ---

    if (animatingDir === "next") {
      // 次へ進む: 全体が左へシフト
      switch (role) {
        case "prev":
          targetPosition = getPosition("OFF_LEFT"); // 画面外へ
          opacity = 0;
          break;
        case "current":
          targetPosition = getPosition("BL"); // Current -> 次の Prev 位置へ
          opacity = 0.7;
          fontSize = "1.5rem";
          break;
        case "next":
          targetPosition = getPosition("BC"); // Next -> 次の Current 位置へ
          opacity = 1;
          fontSize = "2rem";
          color = activeColor;
          break;
        case "nextnext":
          targetPosition = getPosition("BR"); // NextNext -> 次の Next 位置へ
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
          targetPosition = getPosition("BL"); // PrevPrev -> 次の Prev 位置へ
          opacity = 0.7;
          fontSize = "1.5rem";
          break;
        case "prev":
          targetPosition = getPosition("BC"); // Prev -> 次の Current 位置へ
          opacity = 1;
          fontSize = "2rem";
          color = activeColor;
          break;
        case "current":
          targetPosition = getPosition("BR"); // Current -> 次の Next 位置へ
          opacity = 0.7;
          fontSize = "1.5rem";
          break;
        case "next":
          targetPosition = getPosition("OFF_RIGHT"); // 画面外へ
          opacity = 0;
          break;
        default:
          opacity = 0;
      }
    } else {
      // アイドル状態 (通常配置)
      switch (role) {
        case "prevprev":
          targetPosition = getPosition("OFF_LEFT");
          opacity = 0;
          pointerEvents = "none";
          break;
        case "prev":
          targetPosition = getPosition("BL");
          opacity = 0.7;
          cursor = "pointer";
          break;
        case "current":
          targetPosition = getPosition("BC");
          opacity = 1;
          fontSize = "2rem";
          color = activeColor;
          break;
        case "next":
          targetPosition = getPosition("BR");
          opacity = 0.7;
          cursor = "pointer";
          break;
        case "nextnext":
          targetPosition = getPosition("OFF_RIGHT");
          opacity = 0;
          pointerEvents = "none";
          break;
      }
    }

    if (animatingDir) pointerEvents = "none";

    // ターゲットが中央かどうかでスタイル起点を変える（モーフィングを自然にするため）
    // transition-allにより、text-alignの変更は即時適用されるが、
    // transform移動とoriginの変更で視覚的なズレを最小限にする
    const isTargetCenter = targetPosition === "BC" || targetPosition === "TC";

    const baseClassName = `fixed top-0 left-0 font-bold whitespace-pre-line transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] z-50 select-none border-0 bg-transparent p-0 m-0 ${
      isTargetCenter
        ? "origin-bottom-center text-center"
        : "origin-bottom-left text-left"
    }`;

    return {
      className: baseClassName,
      style: {
        transform: getPositionTransform(targetPosition),
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
      {/* Title Block */}
      <header
        className={`fixed z-50 transition-opacity duration-300 ease-in-out ${
          isMobile ? "bottom-0 left-0 w-full" : "top-8 left-8"
        } ${showTitle ? "opacity-100" : "opacity-0"}`}
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
          {titleCharPositions.map((pos, index) => {
            // 修正箇所: pos.y は上からの距離なので、bottom計算を削除し、直接 top で指定します
            return (
              <span
                key={index}
                className="absolute text-blue-300"
                style={{
                  fontSize: isMobile ? "2rem" : "1.75rem",
                  left: `${pos.x}px`,
                  top: `${pos.y}px`, // ここを bottom から top に変更
                  transform: "translate(-50%, -50%)",
                }}
              >
                {pos.char === " " ? "\u00A0" : pos.char}
              </span>
            );
          })}
        </div>
      </header>

      {/* Navigation buttons: "ス" button always visible, "狭" button on top page, close button on other pages */}
      <nav className="fixed top-8 right-8 z-[70] flex items-center gap-3">
        {/* "ス" button - always visible */}
        <Link
          href="/statement"
          className="group relative flex flex-col items-center justify-center text-zinc-400 hover:text-blue-300 transition-colors"
        >
          <div className="w-8 h-8 rounded-full border border-current flex items-center justify-center">
            <span className="text-sm">ス</span>
          </div>
          <span
            className={`absolute top-full mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xs whitespace-nowrap ${
              isMobile && isDiaryPage ? "hidden" : ""
            }`}
            style={{writingMode: "vertical-rl"}}
          >
            テートメント
          </span>
        </Link>
        {/* "狭" button on top page, close button on other pages */}
        {isRootPage ? (
          <button
            onClick={() => {
              const newMode = viewMode === "network" ? "calendar" : "network";
              setViewMode(newMode);
              // Dispatch event to page.tsx
              if (typeof window !== "undefined") {
                window.dispatchEvent(
                  new CustomEvent("viewModeChange", {detail: newMode})
                );
              }
            }}
            className="group relative flex flex-col items-center justify-center text-zinc-400 hover:text-blue-300 transition-colors"
          >
            <div className="w-8 h-8 rounded-full border border-current flex items-center justify-center">
              <span className="text-sm">
                {viewMode === "network" ? "狭" : "広"}
              </span>
            </div>
            <span
              className={`absolute top-full mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xs whitespace-nowrap ${
                isMobile && isDiaryPage ? "hidden" : ""
              }`}
              style={{writingMode: "vertical-rl"}}
            >
              {viewMode === "network" ? "広く並べる" : "狭く並べる"}
            </span>
          </button>
        ) : (
          <Link
            href="/"
            className="group relative flex flex-col items-center justify-center text-zinc-400 hover:text-white transition-all duration-700 delay-300"
            aria-label="Back to index"
          >
            <div className="w-8 h-8 rounded-full border border-current flex items-center justify-center">
              <svg
                width="16"
                height="16"
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
            </div>
          </Link>
        )}
      </nav>

      {/* Date Elements */}
      {!isRootPage && !isStatementPage && (
        <>
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
