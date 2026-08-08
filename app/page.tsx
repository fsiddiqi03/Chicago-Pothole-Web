import { headers } from "next/headers";

import type { DashboardData } from "@/types/dashboard";
import { HeroSection } from "@/components/HeroSection";
import { OldestReportSection } from "@/components/OldestReportSection";
import { MethodologySection } from "@/components/MethodologySection";
import { HomepageCTAs } from "@/components/HomepageCTAs";
import { SiteFooter } from "@/components/SiteFooter";

// The page reads request headers and pulls live, daily-changing data, so it
// must render per request rather than be statically prerendered.
export const dynamic = "force-dynamic";

interface Snapshot {
  data: DashboardData | null;
  /** Epoch ms captured with the data, so every counter on the page shares one
   *  clock and SSR agrees with the first client render. */
  now: number;
}

async function getSnapshot(): Promise<Snapshot> {
  // fetch() in a Server Component needs an absolute URL. The /api/dashboard
  // route lives on this same server, so we rebuild the origin from the
  // incoming request headers — no NEXT_PUBLIC_BASE_URL env var required.
  const headerList = await headers();
  const host = headerList.get("host");
  const now = Date.now();
  if (!host) return { data: null, now };
  const protocol = headerList.get("x-forwarded-proto") ?? "http";

  try {
    const res = await fetch(`${protocol}://${host}/api/dashboard`, {
      cache: "no-store",
    });
    if (!res.ok) return { data: null, now };
    return { data: (await res.json()) as DashboardData, now };
  } catch {
    // Network/DB hiccup: render the page with placeholders rather than crash.
    return { data: null, now };
  }
}

export default async function Home() {
  const { data, now } = await getSnapshot();

  return (
    <>
      <main>
        <HeroSection
          citySummary={data?.city_summary ?? null}
          allWards={data?.all_wards ?? []}
          breachCount={data?.sla_breach_count?.count ?? null}
        />
        <OldestReportSection
          oldest={data?.oldest_open_pothole ?? null}
          latest={data?.latest_open_report ?? null}
          updatedAt={data?.updated_at ?? null}
          now={now}
        />
        <MethodologySection />
        <HomepageCTAs />
      </main>
      <SiteFooter />
    </>
  );
}
