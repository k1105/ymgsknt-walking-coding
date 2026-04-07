// lib/types.ts

export interface DiaryEntry {
  id: string;
  date: string;
  p5jsSketchId: string;
  sketchType?: "p5js-editor" | "local"; // default: "p5js-editor"
  thumbnailUrl?: string;
  rawContent: string; // MDX/Markdown source
}

// スケッチのembed URLを返す
export function getSketchEmbedUrl(entry: DiaryEntry): string {
  if (entry.sketchType === "local") {
    return `/sketches/${entry.id}/index.html`;
  }
  return `https://editor.p5js.org/k1105/embed/${entry.p5jsSketchId}`;
}

// スケッチのソースリンクを返す（ローカルの場合はnull）
export function getSketchSourceUrl(entry: DiaryEntry): string | null {
  if (entry.sketchType === "local") {
    return null;
  }
  return `https://editor.p5js.org/k1105/sketches/${entry.p5jsSketchId}`;
}
