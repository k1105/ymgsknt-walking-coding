"use client";

import Link from "next/link";
import {useEffect, useState} from "react";
import {DiaryEntry, getP5jsEmbedUrl, getP5jsEditorUrl} from "@/lib/types";
import {getNextEntry, getPreviousEntry} from "@/lib/data";
import {useDiaryFrame} from "@/app/diary/DiaryFrame";

interface DiaryClientProps {
  entry: DiaryEntry;
  prevEntry: DiaryEntry | null;
  nextEntry: DiaryEntry | null;
}

export default function DiaryClient({
  entry,
  prevEntry,
  nextEntry,
}: DiaryClientProps) {
  const {setEntryData} = useDiaryFrame();
  const [isContentVisible, setIsContentVisible] = useState(false);

  const nextNextEntry = nextEntry ? getNextEntry(nextEntry.id) : null;
  const prevPrevEntry = prevEntry ? getPreviousEntry(prevEntry.id) : null;

  // Split content into lines for line numbering
  const contentLines = entry.content.split("\n");

  // Add comment line at the beginning
  const commentLine = `/* ${entry.date}_diary.md */`;
  const allLines = [commentLine, ...contentLines];

  useEffect(() => {
    // 1. Frameにデータをセット (これによりFrame側のopacityは100に戻る)
    setEntryData({
      current: entry,
      prev: prevEntry,
      next: nextEntry,
      prevPrev: prevPrevEntry,
      nextNext: nextNextEntry,
    });

    // 2. コンテンツ自体のフェードイン
    // 少し待ってから開始することで、確実に初期状態(opacity-0)を描画させる
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
        {/* Left side (desktop) / Top (mobile) - diary content */}
        <div className="w-full md:w-1/2 h-auto md:h-full flex flex-col">
          <article className="flex-1 overflow-y-auto py-64">
            <div className="font-mono text-sm md:text-base">
              {allLines.map((line, index) => (
                <div key={index} className="flex">
                  {/* Line number with 5rem left margin */}
                  <div className="flex-shrink-0 w-12 md:w-16 px-3 py-2 text-right text-gray-600 select-none">
                    {index + 1}
                  </div>
                  {/* Line content */}
                  <div className="flex-1 px-4 py-2 text-zinc-300">
                    {line || "\u00A0"}
                  </div>
                </div>
              ))}
            </div>
          </article>
        </div>

        {/* Right side (desktop) / Bottom (mobile) - p5.js sketch */}
        <div className="w-full md:w-1/2 h-[50vh] md:h-full flex flex-col md:p-30">
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
              className="text-zinc-400 hover:text-white transition-colors text-sm"
            >
              Open in p5.js Editor →
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
