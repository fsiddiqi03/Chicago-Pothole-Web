import { headers } from "next/headers";
import Link from "next/link";
import type { Metadata } from "next";

import type { DashboardData } from "@/types/dashboard";
import { formatRefreshedAt } from "@/lib/format";
import { WardLeaderboard } from "@/components/WardLeaderboard";
import { SiteFooter } from "@/components/SiteFooter";

// Live, daily-changing data read per request rather than statically prerendered.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ward Leaderboard — Chicago Pothole Tracker",
  description:
    "The ten Chicago wards with the slowest median time to repair a pothole, based on the last 30 days of 311 data.",
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
  const entries = data?.leaderboard ?? [];

  return (
    <>
      <main>
        <section className="px-6 pt-16 pb-10 sm:pt-24">
          <div className="mx-auto max-w-5xl">
            <div
              className="reveal flex items-center gap-4"
              style={{ animationDelay: "40ms" }}
            >
              <span className="size-2.5 shrink-0 bg-chicago-red" />
              <span className="font-mono text-xs tracking-[0.25em] text-neutral-500 uppercase">
                Ward Accountability Index
              </span>
              <span className="h-px flex-1 bg-neutral-300" />
            </div>

            <h1
              className="reveal mt-8 max-w-3xl font-display text-5xl leading-[0.98] tracking-tight text-ink sm:text-7xl"
              style={{ animationDelay: "120ms" }}
            >
              The wards where potholes wait longest.
            </h1>

            <p
              className="reveal mt-7 max-w-2xl text-lg leading-relaxed text-neutral-600"
              style={{ animationDelay: "220ms" }}
            >
              The ten worst-performing wards, ranked by how long they actually
              take to fix a pothole &mdash; the median time from report to
              repair over the last 30 days.
            </p>

            <p
              className="reveal mt-6 font-mono text-[0.7rem] tracking-[0.12em] text-neutral-400 uppercase"
              style={{ animationDelay: "300ms" }}
            >
              {data?.updated_at
                ? `As of ${formatRefreshedAt(data.updated_at)} — `
                : ""}
              data refreshed daily from Chicago 311.
            </p>
          </div>
        </section>

        <section className="px-6 pb-24">
          <div className="mx-auto max-w-5xl">
            <WardLeaderboard entries={entries} />

            <p className="mt-14 max-w-xl text-sm leading-relaxed text-neutral-500">
              Why rank by median time-to-fix instead of raw counts or the share
              past target? Counts favor wards with more engaged residents, and
              SLA percentages swing wildly when a ward&apos;s open backlog is
              small.{" "}
              <Link
                href="/methodology"
                className="rounded-sm font-medium text-ink underline decoration-ink/30 underline-offset-4 transition-colors hover:text-chicago-red focus-visible:ring-2 focus-visible:ring-chicago-blue focus-visible:outline-none"
              >
                Read the methodology
              </Link>
              .
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
