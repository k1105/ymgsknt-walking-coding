// lib/types.ts

// 既存の型定義があれば残しつつ、以下を追加・修正してください

export type RichTextItem = {
  plain_text: string;
  href?: string | null;
  annotations: {
    bold: boolean;
    italic: boolean;
    strikethrough: boolean;
    underline: boolean;
    code: boolean;
    color: string;
  };
};

export type BlockType = "text" | "image" | "code" | "bookmark" | "unknown";

export type ContentBlock =
  | {type: "text"; content: RichTextItem[]}
  | {type: "image"; url: string; caption: string}
  | {type: "code"; text: string; language: string}
  | {type: "bookmark"; url: string; caption: string};

export interface DiaryEntry {
  id: string;
  date: string;
  p5jsSketchId: string;
  thumbnailUrl?: string;
  // contentを文字列ではなくブロック配列に変更
  contentBlocks: ContentBlock[];
}

// p5.js用のヘルパー関数（既存のものを維持）
export function getP5jsEmbedUrl(entry: DiaryEntry) {
  return `https://editor.p5js.org/k1105/embed/${entry.p5jsSketchId}`;
}

export function getP5jsEditorUrl(entry: DiaryEntry) {
  return `https://editor.p5js.org/k1105/sketches/${entry.p5jsSketchId}`;
}
