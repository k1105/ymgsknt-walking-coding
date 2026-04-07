// lib/types.ts

export interface DiaryEntry {
  id: string;
  date: string;
  p5jsSketchId: string;
  thumbnailUrl?: string;
  rawContent: string; // MDX/Markdown source
}

// p5.js用のヘルパー関数
export function getP5jsEmbedUrl(entry: DiaryEntry) {
  return `https://editor.p5js.org/k1105/embed/${entry.p5jsSketchId}`;
}

export function getP5jsEditorUrl(entry: DiaryEntry) {
  return `https://editor.p5js.org/k1105/sketches/${entry.p5jsSketchId}`;
}
