import {Client} from "@notionhq/client";
import {isFullPage} from "@notionhq/client/build/src/helpers";
import {DiaryEntry} from "./types";

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const dataSourceId = process.env.NOTION_DATA_SOURCE_ID;

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
    if (dateProperty.type !== "date" || !dateProperty.date?.start) continue;
    const date = dateProperty.date.start;

    const p5jsSketchIdProperty = page.properties.p5jsSketchId;
    if (p5jsSketchIdProperty.type !== "rich_text") continue;
    const p5jsSketchId = p5jsSketchIdProperty.rich_text
      .map((t) => t.plain_text)
      .join("");

    const thumbnailProperty = page.properties.thumbnail;
    if (thumbnailProperty.type !== "files") continue;
    const thumbnailFile = thumbnailProperty.files[0];
    const thumbnailUrl =
      thumbnailFile?.type === "file"
        ? thumbnailFile.file?.url
        : thumbnailFile?.type === "external"
        ? thumbnailFile.external?.url
        : undefined;

    // ---- content ----
    const blocks = await notion.blocks.children.list({
      block_id: page.id,
    });

    const content = blocks.results
      .map((block) => {
        if (!("type" in block)) return "";
        const blockType = block.type;
        const value = block[blockType as keyof typeof block];
        if (!value || typeof value !== "object" || !("rich_text" in value))
          return "";
        const richText = (value as {rich_text: Array<{plain_text: string}>})
          .rich_text;
        return richText.map((t) => t.plain_text).join("");
      })
      .filter(Boolean)
      .join("\n");

    entries.push({
      id: page.id,
      date,
      p5jsSketchId,
      thumbnailUrl,
      content,
    });
  }

  // Sort entries by date in descending order (newest first)
  return entries.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

// Cache entries to avoid multiple API calls
let cachedEntries: DiaryEntry[] | null = null;
let cachePromise: Promise<DiaryEntry[]> | null = null;

export async function getAllEntries(): Promise<DiaryEntry[]> {
  if (cachedEntries) {
    return cachedEntries;
  }

  if (cachePromise) {
    return cachePromise;
  }

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
  if (currentIndex === -1 || currentIndex === entries.length - 1) {
    return null;
  }
  return entries[currentIndex + 1];
}

export async function getNextEntry(
  currentId: string
): Promise<DiaryEntry | null> {
  const entries = await getAllEntries();
  const currentIndex = entries.findIndex((e) => e.id === currentId);
  if (currentIndex === -1 || currentIndex === 0) {
    return null;
  }
  return entries[currentIndex - 1];
}
