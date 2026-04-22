// DiaryClient.tsx
"use client";

import {useEffect, useRef, useState} from "react";
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
  const [uiOpacity, setUiOpacity] = useState(1);
  const [spacerHeight, setSpacerHeight] = useState(0);
  const articleRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const FADE_VIEWPORT_RATIO = 0.7;
  const READING_BUFFER_RATIO = 0.5;

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

  useEffect(() => {
    const article = articleRef.current;
    const content = contentRef.current;
    if (!article || !content) return;

    const getMetrics = () => {
      const clientHeight = article.clientHeight;
      const contentBottom = content.offsetTop + content.offsetHeight;
      const fadeDistance = clientHeight * FADE_VIEWPORT_RATIO;
      const readingBuffer = clientHeight * READING_BUFFER_RATIO;
      const restingScrollTop = Math.max(
        0,
        contentBottom - clientHeight + readingBuffer
      );
      return {clientHeight, contentBottom, fadeDistance, restingScrollTop};
    };

    const recomputeSpacer = () => {
      const {clientHeight, contentBottom, fadeDistance, restingScrollTop} =
        getMetrics();
      const bottomPad =
        parseFloat(getComputedStyle(article).paddingBottom) || 0;
      // Guarantee maxScroll >= restingScrollTop + fadeDistance
      const needed =
        restingScrollTop + fadeDistance + clientHeight - contentBottom - bottomPad;
      setSpacerHeight(Math.max(0, needed));
    };

    const handleScroll = () => {
      const {fadeDistance, restingScrollTop} = getMetrics();
      if (fadeDistance <= 0) return;
      const pastRest = article.scrollTop - restingScrollTop;
      const progress = Math.max(0, Math.min(1, pastRest / fadeDistance));
      const opacity = 1 - progress;
      setUiOpacity(opacity);
      window.dispatchEvent(
        new CustomEvent("diaryUIFade", {detail: opacity})
      );
    };

    const handleResize = () => {
      recomputeSpacer();
      handleScroll();
    };

    recomputeSpacer();
    handleScroll();
    article.addEventListener("scroll", handleScroll, {passive: true});
    window.addEventListener("resize", handleResize);
    const ro = new ResizeObserver(handleResize);
    ro.observe(content);
    return () => {
      article.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      ro.disconnect();
      window.dispatchEvent(new CustomEvent("diaryUIFade", {detail: 1}));
    };
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
        style={{opacity: uiOpacity}}
      >
        <article
          ref={articleRef}
          className={`flex-1 overflow-y-auto py-64 ${styles.article}`}
        >
          <div ref={contentRef} className="font-mono text-sm md:text-base px-8">
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
          <div aria-hidden style={{height: spacerHeight}} />
        </article>
      </div>
    </div>
  );
}
