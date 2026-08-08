import { headers } from "next/headers";
import type { Metadata } from "next";

import type { DashboardData } from "@/types/dashboard";
import { getCityHistory, getWardHistories } from "@/lib/ward-history";
import { LeaderboardTabs } from "@/components/LeaderboardTabs";
import { SiteFooter } from "@/components/SiteFooter";

// Live, daily-changing data read per request rather than statically prerendered.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ward Leaderboard — Chicago Pothole Tracker",
  description:
    "The ten Chicago wards with the slowest — and the ten with the fastest — median time to repair a pothole, with each ward's full daily history.",
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
  const slowest = data?.leaderboard ?? [];
  const fastest = data?.fastest_leaderboard ?? [];

  // History is read straight from the database rather than over HTTP: this is
  // already a server component, and only the twenty wards on screen are needed.
  // Both queries are independent, so they run together.
  const shownWards = [...slowest, ...fastest].map((e) => e.ward_id);
  const [history, cityHistory] = await Promise.all([
    getWardHistories(shownWards).catch(() => ({ dates: [], series: {} })),
    getCityHistory().catch(() => []),
  ]);

  return (
    <>
      <main>
        <LeaderboardTabs
          slowest={slowest}
          fastest={fastest}
          updatedAt={data?.updated_at ?? null}
          history={history}
          cityHistory={cityHistory}
        />
      </main>
      <SiteFooter />
    </>
  );
}
