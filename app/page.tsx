import {getAllEntries} from "@/lib/data";
import HomeClient from "./HomeClient";

// Enable ISR: revalidate every 24 hours (86400 seconds)
export const revalidate = 86400;

export default async function Home() {
  const entries = await getAllEntries();
  return (
    <>
      {/* <div style={{display: "flex"}}>
        <p
          style={{
            lineHeight: "var(--grid-margin)",
            width: "calc(var(--grid-margin) + var(--grid-width))",
            textAlign: "right",
            marginBottom: "0",
            marginTop: "0",
          }}
        >
          year
        </p>
      </div>

      <p>hogehoge</p>
      <hr />
      <p>hogehoge</p>
      <hr />
      <p>hogehoge</p>
      <hr />
      <p>hogehoge</p>
      <hr />
      <p>hogehoge</p>
      <hr /> */}
      <HomeClient entries={entries} />
    </>
  );
}
