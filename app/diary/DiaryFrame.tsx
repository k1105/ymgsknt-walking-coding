"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useMemo,
  ReactNode,
  useCallback,
} from "react";
import {useRouter, usePathname} from "next/navigation";
import {DiaryEntry} from "@/lib/types";
import Link from "next/link";
import {setupCanvas, drawRoughCurve} from "@/lib/canvas";
import styles from "./DiaryFrame.module.css";

// --- Types & Constants ---
type EntryRole = "prevPrev" | "prev" | "current" | "next" | "nextNext";
interface DiaryContextType {
  setEntryData: (data: Record<EntryRole, DiaryEntry | null>) => void;
  triggerTransition: (direction: "next" | "prev", url: string) => void;
}
const DiaryContext = createContext<DiaryContextType | null>(null);

const DATE_POSITIONS = {
  "-2": {
    pc: "translate3d(-50vw, calc(100dvh - 100% - 2rem), 0)",
    sp: "translate3d(-100%, 5rem, 0)",
  },
  "-1": {
    pc: "translate3d(calc(35vw - 50%), calc(100dvh - 100% - 2rem), 0)",
    sp: "translate3d(2rem, 5rem, 0)",
  },
  "0": {
    pc: "translate3d(calc(50vw - 50%), calc(100dvh - 100% - 2rem), 0)",
    sp: "translate3d(calc(50vw - 50%), 5rem, 0)",
  },
  "1": {
    pc: "translate3d(calc(65vw - 50%), calc(100dvh - 100% - 2rem), 0)",
    sp: "translate3d(calc(100vw - 100% - 2rem), 5rem, 0)",
  },
  "2": {
    pc: "translate3d(100vw, calc(100dvh - 100% - 2rem), 0)",
    sp: "translate3d(100vw, 5rem, 0)",
  },
} as const;

// --- Custom Hooks ---
export function useDiaryFrame() {
  const context = useContext(DiaryContext);
  if (!context) throw new Error("useDiaryFrame error");
  return context;
}

// タイトルアニメーション制御
function useTitleAnimation(isRoot: boolean, isMobile: boolean) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [show, setShow] = useState(!isRoot);
  const textChars = useMemo(() => "Walking●Coding".split(""), []);

  // 現在位置と目標位置
  const positions = useRef(textChars.map(() => ({x: 0, y: 0})));
  const targets = useRef(textChars.map(() => ({x: 0, y: 0})));
  const isIdleRef = useRef(false);
  const idleTimer = useRef<NodeJS.Timeout | null>(null);

  // 【重要】アクセス時に一度だけランダムシードを生成（リロードするまで固定）
  // これにより「ランダム」だが「アニメーション中に振動しない」値を確保
  const [seeds] = useState(() => {
    return textChars.map(() => ({
      x: Math.random(), // 0.0 ~ 1.0
      y: Math.random(), // 0.0 ~ 1.0
      spacing: Math.random(), // PC版のスペーシング用
    }));
  });

  // フェードイン
  useEffect(() => {
    if (!isRoot) return;
    const handler = () => setShow(true);
    window.addEventListener("diaryTitleFadeIn", handler);
    return () => window.removeEventListener("diaryTitleFadeIn", handler);
  }, [isRoot]);

  // アイドル検出 (PCのみ)
  useEffect(() => {
    if (isMobile) return;
    const resetIdle = () => {
      isIdleRef.current = false;
      if (idleTimer.current) clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => {
        isIdleRef.current = true;
      }, 30000);
    };
    resetIdle();
    window.addEventListener("mousemove", resetIdle);
    window.addEventListener("scroll", resetIdle);
    return () => {
      window.removeEventListener("mousemove", resetIdle);
      window.removeEventListener("scroll", resetIdle);
    };
  }, [isMobile]);

  // アニメーションループ
  useEffect(() => {
    let animationFrameId: number;
    // PC用の設定値
    const PC_BASE = {
      w:
        typeof window !== "undefined"
          ? (window.innerWidth - 16 * 11) / 6 + 16 * 3
          : 100,
      h: typeof window !== "undefined" ? (window.innerHeight / 4) * 3 : 400,
      pad: 10,
      offset: {x: 8, y: 8},
    };
    // PC版のY軸スペーシング (シードから計算)
    const pcSpacings = seeds.map((s) => 20 + s.spacing * 15);

    const update = () => {
      const isIdle = isIdleRef.current;
      const wWidth = window.innerWidth;
      const wHeight = window.innerHeight;

      // --- 1. 定位置 (Home) の計算 ---
      // 以前のループ依存の計算をやめ、計算済みの targets を参照する形にするため
      // ここで毎フレーム「あるべき位置」を再計算する（レスポンシブ対応のため）

      const homePositions: {x: number; y: number}[] = [];

      if (isMobile) {
        // === Mobile Logic (過去コードのロジックを復元) ===
        const mw = wWidth;
        const mh = mw / 4;
        const pad = 10;
        const bottomOffset = wHeight - mh; // 画面下部に配置

        // 累積計算用の変数
        let prevXPercent = 0;

        textChars.forEach((_, i) => {
          let x;
          const seed = seeds[i];

          // X座標: 順序を守りつつランダム配置
          if (i === 0) {
            x = mw * 0.05;
            prevXPercent = 0.05;
          } else if (i === textChars.length - 1) {
            x = mw * 0.95;
          } else {
            // 前の文字より右に配置 (最小2% + ランダム)
            const minPercent = prevXPercent + 0.02;
            const remainingChars = textChars.length - i - 1;
            // 後の文字のために3%ずつ空ける
            let maxPercent = 0.95 - remainingChars * 0.03;
            maxPercent = Math.max(minPercent + 0.02, maxPercent);

            // シードを使ってランダム位置を決定
            const xPercent = minPercent + seed.x * (maxPercent - minPercent);
            x = mw * xPercent;
            prevXPercent = xPercent;
          }

          // Y座標: 高さの範囲内でランダム
          // bottomOffset を足して画面下部へ
          const relativeY = pad + seed.y * (mh - pad * 2);
          const y = bottomOffset + relativeY;

          homePositions.push({x, y});
        });
      } else {
        // === PC Logic (サイン波配置) ===
        const {w, h, pad, offset} = PC_BASE;
        textChars.forEach((_, i) => {
          let x, y;
          const seed = seeds[i];
          if (i === 0) {
            x = pad;
            y = pad;
          } else if (i === textChars.length - 1) {
            x = w - pad;
            y = h - pad;
          } else if (i === 8) {
            x = w / 2;
            y = h / 2;
          } else {
            // シードを使用したランダム配置
            // seed.x は 0-1 なので、適度に分散させる
            const waveSeed = i * 0.618 + seed.x * 100;
            x = (Math.sin(waveSeed) * 0.5 + 0.5) * (w - pad * 2) + pad;

            let currentY = i < 8 ? pad : h / 2;
            const startIdx = i < 8 ? 1 : 9;
            for (let k = startIdx; k <= i; k++) currentY += pcSpacings[k];
            y = Math.min(currentY, (i < 8 ? h / 2 : h) - pad);
          }
          homePositions.push({x: x + offset.x, y: y + offset.y});
        });
      }

      // --- 2. ターゲット設定 & アニメーション ---
      textChars.forEach((_, i) => {
        const target = targets.current[i];
        const home = homePositions[i];

        if (isMobile || !isIdle) {
          // モバイルまたは非アイドル時は定位置へ
          target.x = home.x;
          target.y = home.y;
        } else {
          // PCアイドル時: ランダム移動
          const dx = target.x - positions.current[i].x;
          const dy = target.y - positions.current[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 10 || (target.x === 0 && target.y === 0)) {
            target.x = Math.random() * wWidth;
            target.y = Math.random() * wHeight;
          }
        }

        // イージング (Lerp)
        const ease = isIdle ? 0.01 : 0.08;
        positions.current[i].x += (target.x - positions.current[i].x) * ease;
        positions.current[i].y += (target.y - positions.current[i].y) * ease;
      });

      // --- 3. 描画 ---
      if (canvasRef.current) {
        const ctx = setupCanvas(canvasRef.current, wWidth, wHeight);
        if (ctx) {
          ctx.beginPath();
          ctx.strokeStyle = "#000";
          ctx.lineWidth = 1;
          for (let i = 0; i < textChars.length - 1; i++) {
            const curr = positions.current[i];
            const next = positions.current[i + 1];
            if (i === 0) ctx.moveTo(curr.x, curr.y);
            drawRoughCurve(ctx, curr.x, curr.y, next.x, next.y, i * 0.1, 1);
          }
          ctx.stroke();
        }
      }

      // DOM要素位置更新
      textChars.forEach((_, i) => {
        const el = document.getElementById(`title-char-${i}`);
        if (el)
          el.style.transform = `translate(${positions.current[i].x}px, ${positions.current[i].y}px) translate(-50%, -50%)`;
      });

      animationFrameId = requestAnimationFrame(update);
    };

    animationFrameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isMobile, textChars, seeds]); // seedsは不変なのでリロードまで同じ値を維持

  return {canvasRef, show, textChars};
}

// --- Component ---
export default function DiaryFrame({children}: {children: ReactNode}) {
  const router = useRouter();
  const pathname = usePathname();
  const isRoot = pathname === "/";
  const [isMobile, setIsMobile] = useState(false);

  const {canvasRef, show, textChars} = useTitleAnimation(isRoot, isMobile);
  const [viewMode, setViewMode] = useState<"network" | "calendar">("network");
  const [entries, setEntries] = useState<Record<EntryRole, DiaryEntry | null>>({
    current: null,
    prev: null,
    next: null,
    prevPrev: null,
    nextNext: null,
  });
  const [animDir, setAnimDir] = useState<"next" | "prev" | null>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const h = (e: CustomEvent) => setViewMode(e.detail);
    window.addEventListener("viewModeChange", h as EventListener);
    return () =>
      window.removeEventListener("viewModeChange", h as EventListener);
  }, []);

  const triggerTransition = useCallback(
    (dir: "next" | "prev", url: string) => {
      if (animDir) return;
      setAnimDir(dir);
      setTimeout(() => router.push(url), 800);
    },
    [animDir, router]
  );

  const getDateStyle = (role: EntryRole) => {
    const roleIdx = {prevPrev: -2, prev: -1, current: 0, next: 1, nextNext: 2}[
      role
    ];
    const targetIdx =
      roleIdx - (animDir === "next" ? 1 : animDir === "prev" ? -1 : 0);
    const isCenter = targetIdx === 0;
    const isVisible = targetIdx >= -1 && targetIdx <= 1;
    const posKey = String(
      Math.max(-2, Math.min(2, targetIdx))
    ) as keyof typeof DATE_POSITIONS;

    return {
      className: `fixed top-0 left-0 font-bold whitespace-pre-line transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] z-50 select-none ${
        isCenter
          ? "origin-bottom-center text-center"
          : "origin-bottom-left text-left"
      }`,
      style: {
        transform: DATE_POSITIONS[posKey][isMobile ? "sp" : "pc"],
        opacity: isVisible ? (isCenter ? 1 : 0.7) : 0,
        fontSize: isCenter ? "2rem" : "1.5rem",
        lineHeight: isCenter ? "2rem" : "1.5rem",
        color: isCenter ? "rgb(0 0 0)" : "rgb(107 114 128)",
        cursor: !isCenter && isVisible && !animDir ? "pointer" : "default",
        pointerEvents: animDir || !isVisible ? "none" : "auto",
        fontFamily: "var(--font-doto)",
      } as React.CSSProperties,
      onClick: () => {
        if (!animDir && role === "prev" && entries.prev)
          triggerTransition("prev", `/diary/${entries.prev.id}`);
        if (!animDir && role === "next" && entries.next)
          triggerTransition("next", `/diary/${entries.next.id}`);
      },
    };
  };

  return (
    <DiaryContext.Provider
      value={{
        setEntryData: (d) => {
          setEntries(d);
          setAnimDir(null);
        },
        triggerTransition,
      }}
    >
      {/* Title Canvas Layer */}
      <div
        className={`fixed inset-0 z-[100] pointer-events-none transition-opacity duration-300 ${
          show ? "opacity-100" : "opacity-0"
        }`}
      >
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
        {textChars.map((char, i) => (
          <span
            id={`title-char-${i}`}
            key={i}
            className="absolute top-0 left-0 text-black will-change-transform"
            style={{fontSize: isMobile ? "2rem" : "2.75rem"}}
          >
            {char === " " ? "\u00A0" : char}
          </span>
        ))}
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 right-0 z-[70] flex items-center">
        {pathname !== "/statement" && (
          <Link
            href="/statement"
            className="group relative flex flex-col items-center justify-center text-gray-500 hover:text-black transition-colors"
          >
            <div
              className={`border border-current flex items-center justify-center ${styles.button}`}
            >
              <span className={isMobile ? "text-base" : "text-xl"}>何</span>
            </div>
            <span
              className={`absolute top-full mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xl whitespace-nowrap ${
                isMobile && pathname.startsWith("/diary/") ? "hidden" : ""
              }`}
              style={{writingMode: "vertical-rl"}}
            >
              What&apos;s this?
            </span>
          </Link>
        )}
        {isRoot ? (
          <button
            onClick={() => {
              const next = viewMode === "network" ? "calendar" : "network";
              setViewMode(next);
              window.dispatchEvent(
                new CustomEvent("viewModeChange", {detail: next})
              );
            }}
            className="group relative flex flex-col items-center justify-center text-gray-500 hover:text-black transition-colors"
          >
            <div
              className={`rounded-full border border-current flex items-center justify-center ${styles.button}`}
            >
              <span className={isMobile ? "text-base" : "text-xl"}>
                {viewMode === "network" ? "狭" : "広"}
              </span>
            </div>
            <span
              className={`absolute top-full mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xl whitespace-nowrap ${
                isMobile && pathname.startsWith("/diary/") ? "hidden" : ""
              }`}
              style={{writingMode: "vertical-rl"}}
            >
              く並べる
            </span>
          </button>
        ) : (
          <Link
            href="/"
            className="group relative flex flex-col items-center justify-center text-gray-500 hover:text-black transition-all duration-700 delay-300"
          >
            <div
              className={`flex items-center justify-center ${styles.button}`}
            >
              <svg
                width={
                  isMobile ? "var(--grid-width)" : "calc(var(--grid-width) / 3)"
                }
                height={
                  isMobile ? "var(--grid-width)" : "calc(var(--grid-width) / 3)"
                }
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
              >
                <line x1="24" y1="0" x2="0" y2="24" />
                <line x1="0" y1="0" x2="24" y2="24" />
              </svg>
            </div>
          </Link>
        )}
      </nav>

      {/* Dates */}
      {!isRoot &&
        pathname !== "/statement" &&
        (Object.keys(entries) as EntryRole[]).map((role) => {
          const entry = entries[role];
          if (!entry) return null;
          const s = getDateStyle(role);
          return (
            <div
              key={entry.id}
              className={s.className}
              style={s.style}
              onClick={s.onClick}
            >
              {(() => {
                const D = new Date(entry.date);
                return `${String(D.getFullYear()).slice(-2)}\n${String(
                  D.getMonth() + 1
                ).padStart(2, "0")}\n${String(D.getDate()).padStart(2, "0")}`;
              })()}
            </div>
          );
        })}

      <div
        className={`transition-opacity duration-700 ease-in-out will-change-[opacity] ${
          isRoot || !animDir ? "opacity-100" : "opacity-0"
        }`}
      >
        {children}
      </div>
    </DiaryContext.Provider>
  );
}
