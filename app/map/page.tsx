import { Suspense } from "react";
import type { Metadata } from "next";

import { PotholeMap } from "@/components/map/PotholeMap";

export const metadata: Metadata = {
  title: "Map · Chicago Pothole Tracker",
  description:
    "Every currently-open pothole in Chicago's 311 system, mapped. Filter by ward or status and click a pin for details.",
};

// The site Header is rendered globally in app/layout.tsx, so this page only
// supplies the map itself, which fills the viewport beneath that sticky header.
export default function MapPage() {
  return (
    <Suspense fallback={<div className="h-[calc(100dvh-4rem)] w-full bg-paper" />}>
      <PotholeMap />
    </Suspense>
  );
}
