// DiaryClient.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import {useEffect, useState} from "react";
import {
  DiaryEntry,
  getP5jsEmbedUrl,
  getP5jsEditorUrl,
  ContentBlock,
  RichTextItem,
} from "@/lib/types";
import {useDiaryFrame} from "@/app/diary/DiaryFrame";
import styles from "./DiaryClient.module.css";

/* --- サブコンポーネント: リッチテキストレンダラー --- */
const RichTextRenderer = ({items}: {items: RichTextItem[]}) => {
  if (!items || items.length === 0) return <span className="opacity-50"></span>;

  return (
    <>
      {items.map((item, index) => {
        const {bold, italic, strikethrough, underline, code, color} =
          item.annotations;

        // スタイルの適用
        let className = "";
        if (bold) className += " font-bold";
        if (italic) className += " italic";
        if (strikethrough) className += " line-through";
        if (underline) className += " underline";
        if (code)
          className += " font-mono bg-gray-100 rounded px-1 text-red-500";
        if (color !== "default") className += ` text-${color}-500`; // Tailwindの色クラスを想定

        const content = <span className={className}>{item.plain_text}</span>;

        // リンクの場合
        if (item.href) {
          return (
            <a
              key={index}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline cursor-pointer z-10 relative"
            >
              {content}
            </a>
          );
        }

        return <span key={index}>{content}</span>;
      })}
    </>
  );
};

/* --- サブコンポーネント: ブロックレンダラー --- */
const BlockRenderer = ({block}: {block: ContentBlock}) => {
  switch (block.type) {
    case "text":
      // テキストブロック（段落）
      return (
        <div className="whitespace-pre-wrap leading-relaxed">
          <RichTextRenderer items={block.content} />
        </div>
      );

    case "image":
      return (
        <div className="my-4">
          <div className="relative w-full h-auto rounded overflow-hidden border border-gray-200">
            {/* next/image の fill で画像全体をカバー */}
            <div className="relative w-full h-[300px] max-h-[500px]">
              <Image
                src={block.url}
                alt={block.caption || "Diary Image"}
                fill
                className="object-cover rounded"
                style={{objectFit: "cover"}}
                loading="lazy"
                sizes="100vw"
              />
            </div>
          </div>
          {block.caption && (
            <div className="text-xs text-gray-500 mt-1 font-sans text-center">
              {block.caption}
            </div>
          )}
        </div>
      );

    case "code":
      return (
        <div className="my-2 bg-[#f6f8fa] border border-gray-200 rounded p-3 overflow-x-auto">
          <div className="text-xs text-gray-400 mb-1 select-none font-sans uppercase">
            {block.language}
          </div>
          <pre className="font-mono text-sm text-gray-800">
            <code>{block.text}</code>
          </pre>
        </div>
      );

    case "bookmark":
      return (
        <div className="my-2">
          <a
            href={block.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex border border-gray-200 rounded hover:bg-gray-50 transition-colors p-3 no-underline group"
          >
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-800 truncate group-hover:text-blue-600">
                {block.caption || block.url}
              </div>
              <div className="text-xs text-gray-400 mt-1 truncate">
                {block.url}
              </div>
            </div>
            <span className="text-gray-400 ml-2">↗</span>
          </a>
        </div>
      );

    default:
      return null;
  }
};

/* --- メインコンポーネント --- */

interface DiaryClientProps {
  entry: DiaryEntry;
  prevEntry: DiaryEntry | null;
  nextEntry: DiaryEntry | null;
  prevPrevEntry: DiaryEntry | null;
  nextNextEntry: DiaryEntry | null;
}

export default function DiaryClient({
  entry,
  prevEntry,
  nextEntry,
  prevPrevEntry,
  nextNextEntry,
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

  // ヘッダー行（ファイル名風）
  const headerBlock: ContentBlock = {
    type: "text",
    content: [
      {
        plain_text: `/* ${entry.date}_diary.md */`,
        annotations: {
          bold: false,
          italic: false,
          strikethrough: false,
          underline: false,
          code: false,
          color: "gray",
        },
      },
    ],
  };

  // 表示用にヘッダーとコンテンツを結合
  const displayBlocks = [headerBlock, ...entry.contentBlocks];

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
            <div className="font-mono text-sm md:text-base">
              {displayBlocks.map((block, index) => (
                <div
                  key={index}
                  className={`${styles.lineContainer} flex items-start`}
                >
                  {/* 行番号 */}
                  <div
                    className={`flex-shrink-0 py-2 text-gray-400 select-none text-right pr-4 w-12 border-r border-transparent ${styles.lineNumber}`}
                    style={{minWidth: "3rem"}}
                  >
                    {index + 1}
                  </div>

                  {/* ブロックコンテンツ */}
                  <div
                    className="flex-1 py-2 pl-4 text-black w-full min-w-0"
                    style={{
                      // 既存のスタイルがあれば維持。なければ以下のように通常の幅指定
                      maxWidth: "100%",
                    }}
                  >
                    <BlockRenderer block={block} />
                  </div>
                </div>
              ))}

              {/* コンテンツ終了後の余白用に行番号だけ少し出すなどの演出が必要ならここに追加 */}
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
