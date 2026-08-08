import { headers } from "next/headers";
import type { Metadata } from "next";

import type { DashboardData } from "@/types/dashboard";
import { LeaderboardTabs } from "@/components/LeaderboardTabs";
import { SiteFooter } from "@/components/SiteFooter";

// Live, daily-changing data read per request rather than statically prerendered.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ward Leaderboard — Chicago Pothole Tracker",
  description:
    "The ten Chicago wards with the slowest — and the ten with the fastest — median time to repair a pothole, based on the last 30 days of 311 data.",
};

async function getDashboardData(): Promise<DashboardData | null> {
  // Same-origin fetch to the existing dashboard route, which already returns
  // the ranked leaderboard. Rebuild the origin from request headers so no
  // base-URL env var is required.
  const headerList = await headers();
  const host = headerList.get("host");
  if (!host) return null;
  const protocol = headerList.get("x-forwarded-proto") ?? "http";

  try {
    const res = await fetch(`${protocol}://${host}/api/dashboard`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as DashboardData;
  } catch {
    return null;
  }
}

export default async function LeaderboardPage() {
  const data = await getDashboardData();

  return (
    <>
      <main>
        <LeaderboardTabs
          slowest={data?.leaderboard ?? []}
          fastest={data?.fastest_leaderboard ?? []}
          updatedAt={data?.updated_at ?? null}
        />
      </main>
      <SiteFooter />
    </>
  );
}
