// DiaryClient.tsx
"use client";

import Link from "next/link";
import {useEffect, useState} from "react";
import {
  DiaryEntry,
  getSketchEmbedUrl,
  getSketchSourceUrl,
} from "@/lib/types";
import {useDiaryFrame} from "@/app/diary/DiaryFrame";
import styles from "./DiaryClient.module.css";

/* --- メインコンポーネント --- */

interface DiaryClientProps {
  entry: DiaryEntry;
  prevEntry: DiaryEntry | null;
  nextEntry: DiaryEntry | null;
  prevPrevEntry: DiaryEntry | null;
  nextNextEntry: DiaryEntry | null;
  children: React.ReactNode; // Server-rendered MDX content
}

export default function DiaryClient({
  entry,
  prevEntry,
  nextEntry,
  prevPrevEntry,
  nextNextEntry,
  children,
}: DiaryClientProps) {
  const {setEntryData} = useDiaryFrame();
  const [isContentVisible, setIsContentVisible] = useState(false);

  const isLocal = entry.sketchType === "local";
  const sourceUrl = getSketchSourceUrl(entry);

  useEffect(() => {
    setEntryData({
      current: entry,
      prev: prevEntry,
      next: nextEntry,
      prevPrev: prevPrevEntry,
      nextNext: nextNextEntry,
    });

    const timer = setTimeout(() => {
      setIsContentVisible(true);
    }, 100);

    return () => clearTimeout(timer);
  }, [entry.id]);

  // ローカルスケッチ: フルスクリーンスケッチ + 左側に日記（元のスタイル）
  if (isLocal) {
    return (
      <div
        className={`h-screen w-screen relative overflow-hidden transition-opacity duration-700 ease-out ${
          isContentVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Fullscreen Sketch — behind diary */}
        <iframe
          src={getSketchEmbedUrl(entry)}
          className="absolute inset-0 w-full h-full border-0"
          allow="autoplay"
        />

        {/* Diary Content — left side, transparent with text shadow for readability */}
        <div
          className={`absolute left-0 top-0 h-full flex flex-col ${styles.textArea} z-10`}
          style={{textShadow: "0 0 8px rgba(0,0,0,0.8), 0 0 2px rgba(0,0,0,0.9)"}}
        >
          <article
            className={`flex-1 overflow-y-auto py-64 ${styles.article}`}
          >
            <div className="font-mono text-sm md:text-base px-8 text-white">
              {/* Header — manual line number style */}
              <div className="flex items-start gap-[var(--grid-gap)] py-2 mb-2">
                <span className="flex-shrink-0 w-8 text-right opacity-40 text-xs leading-relaxed select-none">0</span>
                <span className="opacity-60">{`/* ${entry.date}_diary.md */`}</span>
              </div>

              {/* MDX Content with line numbers */}
              {children}
            </div>
          </article>
        </div>
      </div>
    );
  }

  // p5js-editor: 従来の左右分割レイアウト
  return (
    <div className="min-h-screen overflow-hidden relative">
      <main
        className={`min-h-screen md:h-screen flex flex-col md:flex-row transition-all duration-700 ease-out transform will-change-[opacity,transform] ${
          isContentVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Left side: Diary Content */}
        <div className={`h-auto md:h-full flex flex-col ${styles.textArea}`}>
          <article className={`flex-1 overflow-y-auto py-64 ${styles.article}`}>
            <div className="font-mono text-sm md:text-base px-8">
              {/* Header — manual line number style */}
              <div className="flex items-start gap-[var(--grid-gap)] py-2 mb-2">
                <span className="flex-shrink-0 w-8 text-right text-gray-400 text-xs leading-relaxed select-none">0</span>
                <span className="text-gray-400">{`/* ${entry.date}_diary.md */`}</span>
              </div>

              {/* MDX Content with line numbers */}
              <div className="text-black">{children}</div>
            </div>
          </article>
        </div>

        {/* Right side: Sketch */}
        <div className="w-full md:w-1/2 h-[50vh] md:h-full flex flex-col md:p-30 bg-white border-l border-gray-100">
          <div className="flex-1 relative">
            <iframe
              src={getSketchEmbedUrl(entry)}
              width="100%"
              height="100%"
              className="border-0"
              allow="autoplay"
            />
          </div>
          {sourceUrl && (
            <div className="p-4 text-center">
              <Link
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-black transition-colors text-sm font-mono"
              >
                Open in p5.js Editor →
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
