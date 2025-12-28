import {notFound} from "next/navigation";
import {dummyDiaryEntries, getPreviousEntry, getNextEntry} from "@/lib/data";
import DiaryClient from "./DiaryClient";

interface DiaryPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateStaticParams() {
  return dummyDiaryEntries.map((entry) => ({
    id: entry.id,
  }));
}

export default async function DiaryPage({params}: DiaryPageProps) {
  const {id} = await params;
  const entry = dummyDiaryEntries.find((e) => e.id === id);

  if (!entry) {
    notFound();
  }

  const prevEntry = getPreviousEntry(id);
  const nextEntry = getNextEntry(id);

  return (
    <DiaryClient entry={entry} prevEntry={prevEntry} nextEntry={nextEntry} />
  );
}
