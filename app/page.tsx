import {getAllEntries} from "@/lib/data";
import HomeClient from "./HomeClient";

// Enable ISR: revalidate every 24 hours
export const revalidate = 60 * 60 * 24;

export default async function Home() {
  const entries = await getAllEntries();
  return <HomeClient entries={entries} />;
}
