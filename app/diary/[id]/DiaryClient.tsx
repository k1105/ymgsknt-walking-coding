// DiaryClient.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import {useEffect, useState} from "react";
import {MDXRemote, MDXRemoteSerializeResult} from "next-mdx-remote";
import {
  DiaryEntry,
  getP5jsEmbedUrl,
  getP5jsEditorUrl,
} from "@/lib/types";
import {useDiaryFrame} from "@/app/diary/DiaryFrame";
import styles from "./DiaryClient.module.css";

/* --- MDX Custom Components --- */
const mdxComponents = {
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <div className="whitespace-pre-wrap leading-relaxed mb-4" {...props} />
  ),
  h1: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1 className="text-2xl font-bold mb-4" {...props} />
  ),
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className="text-xl font-bold mb-3" {...props} />
  ),
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className="text-lg font-bold mb-2" {...props} />
  ),
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 hover:underline cursor-pointer z-10 relative"
      {...props}
    />
  ),
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="list-disc pl-6 mb-4" {...props} />
  ),
  ol: (props: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className="list-decimal pl-6 mb-4" {...props} />
  ),
  li: (props: React.HTMLAttributes<HTMLLIElement>) => (
    <li className="mb-1" {...props} />
  ),
  blockquote: (props: React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote
      className="border-l-4 border-gray-300 pl-4 italic text-gray-600 mb-4"
      {...props}
    />
  ),
  code: (props: React.HTMLAttributes<HTMLElement>) => (
    <code
      className="font-mono bg-gray-100 rounded px-1 text-red-500 text-sm"
      {...props}
    />
  ),
  pre: (props: React.HTMLAttributes<HTMLPreElement>) => (
    <div className="my-2 bg-[#f6f8fa] border border-gray-200 rounded p-3 overflow-x-auto mb-4">
      <pre className="font-mono text-sm text-gray-800" {...props} />
    </div>
  ),
  img: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <span className="block my-4">
      <span className="relative block w-full h-[300px] max-h-[500px] rounded overflow-hidden border border-gray-200">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="w-full h-full object-cover rounded"
          loading="lazy"
          alt={props.alt || "Diary Image"}
          {...props}
        />
      </span>
    </span>
  ),
  hr: () => <hr className="my-6 border-gray-200" />,
};

/* --- メインコンポーネント --- */

interface DiaryClientProps {
  entry: DiaryEntry;
  mdxSource: MDXRemoteSerializeResult;
  prevEntry: DiaryEntry | null;
  nextEntry: DiaryEntry | null;
  prevPrevEntry: DiaryEntry | null;
  nextNextEntry: DiaryEntry | null;
}

export default function DiaryClient({
  entry,
  mdxSource,
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

              {/* MDX Content */}
              <div className="text-black">
                <MDXRemote {...mdxSource} components={mdxComponents} />
              </div>
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
