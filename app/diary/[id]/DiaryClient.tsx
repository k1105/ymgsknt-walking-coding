// DiaryClient.tsx
"use client";

import {useEffect, useState} from "react";
import {DiaryEntry, getSketchEmbedUrl} from "@/lib/types";
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

  return (
    <div
      className="h-screen w-screen relative overflow-hidden"
    >
      <iframe
        src={getSketchEmbedUrl(entry)}
        className={`absolute inset-0 w-full h-full border-0 transition-opacity duration-700 ease-out ${
          isContentVisible ? "opacity-100" : "opacity-0"
        }`}
        allow="autoplay"
      />

      <div
        className={`absolute left-0 top-0 h-full flex flex-col ${styles.textArea} z-10`}
      >
        <article className={`flex-1 overflow-y-auto py-64 ${styles.article}`}>
          <div className="font-mono text-sm md:text-base px-8">
            {/* Header — manual line number style */}
            <div className="flex items-start gap-[var(--grid-gap)] py-2 mb-2">
              <span className="flex-shrink-0 w-8 text-right opacity-40 text-xs leading-relaxed select-none">
                0
              </span>
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
