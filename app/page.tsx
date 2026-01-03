import {getAllEntries} from "@/lib/data";
import HomeClient from "./HomeClient";

// Enable ISR: revalidate every 24 hours (86400 seconds)
export const revalidate = 86400;

export default async function Home() {
  const entries = await getAllEntries();
  return <HomeClient entries={entries} />;
}
