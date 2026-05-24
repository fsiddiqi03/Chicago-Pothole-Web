import { headers } from "next/headers";

import type { DashboardData } from "@/types/dashboard";
import { HeroSection } from "@/components/HeroSection";
import { StatsStrip } from "@/components/StatsStrip";
import { MethodologySection } from "@/components/MethodologySection";
import { HomepageCTAs } from "@/components/HomepageCTAs";
import { SiteFooter } from "@/components/SiteFooter";

// The page reads request headers and pulls live, daily-changing data, so it
// must render per request rather than be statically prerendered.
export const dynamic = "force-dynamic";

async function getDashboardData(): Promise<DashboardData | null> {
  // fetch() in a Server Component needs an absolute URL. The /api/dashboard
  // route lives on this same server, so we rebuild the origin from the
  // incoming request headers — no NEXT_PUBLIC_BASE_URL env var required.
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
    // Network/DB hiccup: render the page with placeholders rather than crash.
    return null;
  }
}

export default async function Home() {
  const data = await getDashboardData();
  // Captured once on the server so the hero counter's first paint matches
  // between SSR and hydration.
  const now = Date.now();

  return (
    <>
      <main>
        <HeroSection
          openCount={data?.city_summary?.total_open ?? null}
          latestReport={data?.latest_open_report ?? null}
          now={now}
        />
        <StatsStrip
          citySummary={data?.city_summary ?? null}
          slaBreach={data?.sla_breach_count ?? null}
          updatedAt={data?.updated_at ?? null}
          oldestPothole={data?.oldest_open_pothole ?? null}
          now={now}
        />
        <MethodologySection />
        <HomepageCTAs />
      </main>
      <SiteFooter />
    </>
  );
}
