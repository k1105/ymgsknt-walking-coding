// lib/data.ts
// File-system based data loader (replaces Notion CMS)

import fs from "fs";
import path from "path";
import {DiaryEntry} from "./types";

// sketches/ は public/sketches/ に配置して静的配信する。
// データ読み込みも静的配信も同じディレクトリ。
const SKETCHES_DIR = path.join(process.cwd(), "public", "sketches");

interface MetaJson {
  date: string;
  p5jsSketchId: string;
  sketchType?: "p5js-editor" | "local";
  thumbnail?: string;
  notionPageId?: string;
}

function getSketchDirs(): string[] {
  if (!fs.existsSync(SKETCHES_DIR)) return [];
  return fs
    .readdirSync(SKETCHES_DIR, {withFileTypes: true})
    .filter((d) => d.isDirectory() && /^\d{4}-\d{2}-\d{2}/.test(d.name))
    .map((d) => d.name)
    .sort()
    .reverse(); // newest first
}

function loadEntry(dirName: string): DiaryEntry | null {
  const dir = path.join(SKETCHES_DIR, dirName);
  const metaPath = path.join(dir, "meta.json");

  if (!fs.existsSync(metaPath)) return null;

  try {
    const meta: MetaJson = JSON.parse(
      fs.readFileSync(metaPath, "utf-8")
    );

    // Read diary content (MDX/MD)
    let rawContent = "";
    const mdxPath = path.join(dir, "diary.mdx");
    const mdPath = path.join(dir, "diary.md");
    if (fs.existsSync(mdxPath)) {
      rawContent = fs.readFileSync(mdxPath, "utf-8");
    } else if (fs.existsSync(mdPath)) {
      rawContent = fs.readFileSync(mdPath, "utf-8");
    }

    // Thumbnail path
    let thumbnailUrl: string | undefined;
    if (meta.thumbnail) {
      thumbnailUrl = `/sketches/${dirName}/${meta.thumbnail}`;
    }

    // Rewrite relative image paths to absolute paths for web serving
    // ./images/foo.png → /sketches/YYYY-MM-DD/images/foo.png
    const rewrittenContent = rawContent.replace(
      /\.\/(images\/[^\s)]+)/g,
      `/sketches/${dirName}/$1`
    );

    // Auto-detect local sketch if index.html exists
    const hasLocalSketch = fs.existsSync(path.join(dir, "index.html"));
    const sketchType = meta.sketchType || (hasLocalSketch ? "local" : "p5js-editor");

    return {
      id: dirName, // use date as ID
      date: meta.date,
      p5jsSketchId: meta.p5jsSketchId,
      sketchType,
      thumbnailUrl,
      rawContent: rewrittenContent,
    };
  } catch (e) {
    console.error(`Failed to load entry ${dirName}:`, e);
    return null;
  }
}

// Cache
let cachedEntries: DiaryEntry[] | null = null;

export async function getAllEntries(): Promise<DiaryEntry[]> {
  if (cachedEntries) return cachedEntries;

  const dirs = getSketchDirs();
  const entries = dirs
    .map((dir) => loadEntry(dir))
    .filter((e): e is DiaryEntry => e !== null);

  cachedEntries = entries;
  return entries;
}

export async function getEntryById(id: string): Promise<DiaryEntry | null> {
  const entries = await getAllEntries();
  return entries.find((e) => e.id === id) ?? null;
}

export async function getPreviousEntry(
  currentId: string
): Promise<DiaryEntry | null> {
  const entries = await getAllEntries();
  const currentIndex = entries.findIndex((e) => e.id === currentId);
  if (currentIndex === -1 || currentIndex === entries.length - 1) return null;
  return entries[currentIndex + 1];
}

export async function getNextEntry(
  currentId: string
): Promise<DiaryEntry | null> {
  const entries = await getAllEntries();
  const currentIndex = entries.findIndex((e) => e.id === currentId);
  if (currentIndex === -1 || currentIndex === 0) return null;
  return entries[currentIndex - 1];
}
