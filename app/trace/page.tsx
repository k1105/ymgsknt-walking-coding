import { Suspense } from "react";
import TraceClient from "./TraceClient";

export default function TracePage() {
  return (
    <Suspense>
      <TraceClient />
    </Suspense>
  );
}
