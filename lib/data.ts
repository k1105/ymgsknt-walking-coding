// lib/data.ts
import {Client} from "@notionhq/client";
import {isFullPage} from "@notionhq/client/build/src/helpers";
import {DiaryEntry, ContentBlock, RichTextItem} from "./types";

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const dataSourceId = process.env.NOTION_DATA_SOURCE_ID;

// Notion API からの型定義（最小限）
interface NotionRichTextItem {
  plain_text: string;
  href?: string | null;
  annotations?: {
    bold?: boolean;
    italic?: boolean;
    strikethrough?: boolean;
    underline?: boolean;
    code?: boolean;
    color?: string;
  };
}

// NotionのRichTextオブジェクトをアプリ用の型に変換するヘルパー
function transformRichText(
  notionRichText: NotionRichTextItem[]
): RichTextItem[] {
  if (!notionRichText) return [];
  return notionRichText.map((t) => ({
    plain_text: t.plain_text,
    href: t.href,
    annotations: {
      bold: t.annotations?.bold ?? false,
      italic: t.annotations?.italic ?? false,
      strikethrough: t.annotations?.strikethrough ?? false,
      underline: t.annotations?.underline ?? false,
      code: t.annotations?.code ?? false,
      color: t.annotations?.color ?? "default",
    },
  }));
}

async function fetchAllEntries(): Promise<DiaryEntry[]> {
  if (!dataSourceId) {
    throw new Error("NOTION_DATA_SOURCE_ID is not set");
  }

  const res = await notion.dataSources.query({
    data_source_id: dataSourceId,
    page_size: 100,
  });

  const pages = res.results.filter(isFullPage);
  const entries: DiaryEntry[] = [];

  for (const page of pages) {
    // ---- properties ----
    const dateProperty = page.properties.Date;
    if (dateProperty?.type !== "date" || !dateProperty.date?.start) continue;
    const date = dateProperty.date.start;

    const p5jsSketchIdProperty = page.properties.p5jsSketchId;

    if (p5jsSketchIdProperty?.type !== "rich_text") continue;
    const p5jsSketchId = p5jsSketchIdProperty.rich_text
      .map((t: NotionRichTextItem) => t.plain_text)
      .join("");

    const thumbnailProperty = page.properties.thumbnail;
    let thumbnailUrl: string | undefined;

    if (
      thumbnailProperty?.type === "files" &&
      thumbnailProperty.files.length > 0
    ) {
      const fileObj = thumbnailProperty.files[0];
      if (fileObj.type === "file") {
        thumbnailUrl = fileObj.file.url;
      } else if (fileObj.type === "external") {
        thumbnailUrl = fileObj.external.url;
      }
    }

    // ---- content (blocks) ----
    const blocksRes = await notion.blocks.children.list({
      block_id: page.id,
    });

    const contentBlocks: ContentBlock[] = blocksRes.results
      .map((block: Record<string, unknown>) => {
        // 1. 画像 (Image)
        if (block.type === "image") {
          const image = block.image as Record<string, unknown>;
          const url =
            image.type === "file"
              ? ((image.file as Record<string, unknown>).url as string)
              : ((image.external as Record<string, unknown>).url as string);
          const caption =
            (image.caption as NotionRichTextItem[] | undefined)
              ?.map((c) => c.plain_text)
              .join("") || "";
          return {type: "image", url, caption};
        }

        // 2. コード (Code)
        if (block.type === "code") {
          const code = block.code as Record<string, unknown>;
          const text =
            (code.rich_text as NotionRichTextItem[] | undefined)
              ?.map((t) => t.plain_text)
              .join("") || "";
          const language = code.language as string;
          return {type: "code", text, language};
        }

        // 3. ブックマーク (Bookmark)
        if (block.type === "bookmark") {
          const bookmark = block.bookmark as Record<string, unknown>;
          const url = bookmark.url as string;
          const caption =
            (bookmark.caption as NotionRichTextItem[] | undefined)
              ?.map((c) => c.plain_text)
              .join("") || "";
          return {type: "bookmark", url, caption};
        }

        // 4. テキスト (Paragraph, Headings, Lists, Quote, etc.)
        // これらをすべて「テキストブロック」として扱います。
        // 必要に応じて headingなどを区別するtypeを作っても良いですが、
        // ここでは汎用的に rich_text を持つものを抽出します。
        const type = block.type as string;
        const typeBlock = block[type] as Record<string, unknown> | undefined;
        if (typeBlock && typeBlock.rich_text) {
          return {
            type: "text",
            content: transformRichText(
              typeBlock.rich_text as NotionRichTextItem[]
            ),
          };
        }

        // 未対応のブロック
        return null;
      })
      .filter((b): b is ContentBlock => b !== null);

    entries.push({
      id: page.id,
      date,
      p5jsSketchId,
      thumbnailUrl,
      contentBlocks, // 文字列ではなくブロック配列を保存
    });
  }

  // 日付降順ソート
  return entries.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

// キャッシュロジック
let cachedEntries: DiaryEntry[] | null = null;
let cachePromise: Promise<DiaryEntry[]> | null = null;

export async function getAllEntries(): Promise<DiaryEntry[]> {
  if (cachedEntries) return cachedEntries;
  if (cachePromise) return cachePromise;

  cachePromise = fetchAllEntries().then((entries) => {
    cachedEntries = entries;
    return entries;
  });

  return cachePromise;
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
