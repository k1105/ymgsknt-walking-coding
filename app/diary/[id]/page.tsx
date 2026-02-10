import {notFound} from "next/navigation";
import {
  getAllEntries,
  getEntryById,
  getPreviousEntry,
  getNextEntry,
} from "@/lib/data";
import DiaryClient from "./DiaryClient";

interface DiaryPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateStaticParams() {
  const entries = await getAllEntries();
  return entries.map((entry) => ({
    id: entry.id,
  }));
}

export default async function DiaryPage({params}: DiaryPageProps) {
  const {id} = await params;
  const entry = await getEntryById(id);

  if (!entry) {
    notFound();
  }

  const prevEntry = await getPreviousEntry(id);
  const nextEntry = await getNextEntry(id);
  const prevPrevEntry = prevEntry ? await getPreviousEntry(prevEntry.id) : null;
  const nextNextEntry = nextEntry ? await getNextEntry(nextEntry.id) : null;

  return (
    <DiaryClient
      entry={entry}
      prevEntry={prevEntry}
      nextEntry={nextEntry}
      prevPrevEntry={prevPrevEntry}
      nextNextEntry={nextNextEntry}
    />
  );
}
