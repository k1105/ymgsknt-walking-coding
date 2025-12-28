export interface DiaryEntry {
  id: string;
  date: string;
  content: string;
  p5jsUsername?: string; // デフォルト: "k1105"
  p5jsSketchId: string;
  thumbnailUrl?: string;
}

// p5.js URL生成ヘルパー関数
export function getP5jsEmbedUrl(entry: DiaryEntry): string {
  const username = entry.p5jsUsername || "k1105";
  return `https://preview.p5js.org/${username}/embed/${entry.p5jsSketchId}`;
}

export function getP5jsEditorUrl(entry: DiaryEntry): string {
  const username = entry.p5jsUsername || "k1105";
  return `https://editor.p5js.org/${username}/sketches/${entry.p5jsSketchId}`;
}
