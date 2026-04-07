// DiaryClient.tsx
"use client";

import Link from "next/link";
import {useEffect, useState} from "react";
import {
  DiaryEntry,
  getP5jsEmbedUrl,
  getP5jsEditorUrl,
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
              {/* Header */}
              <div className="text-gray-400 mb-6">
                {`/* ${entry.date}_diary.md */`}
              </div>

              {/* MDX Content (server-rendered) */}
              <div className="text-black">{children}</div>
            </div>
          </article>
        </div>

        {/* Right side: p5.js sketch */}
        <div className="w-full md:w-1/2 h-[50vh] md:h-full flex flex-col md:p-30 bg-white border-l border-gray-100">
          <div className="flex-1 relative">
            <iframe
              src={getP5jsEmbedUrl(entry)}
              width="100%"
              height="100%"
              className="border-0"
              allow="autoplay"
            />
          </div>
          <div className="p-4 text-center">
            <Link
              href={getP5jsEditorUrl(entry)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-black transition-colors text-sm font-mono"
            >
              Open in p5.js Editor →
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
