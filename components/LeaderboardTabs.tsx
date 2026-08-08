"use client";

import Link from "next/link";
import { useId, useState } from "react";

import type { LeaderboardEntry } from "@/types/dashboard";
import type { CityHistoryPoint, WardHistoryBundle } from "@/lib/ward-history";
import { cn } from "@/lib/utils";
import { formatRefreshedAt } from "@/lib/format";
import { SectionHeading } from "@/components/SectionHeading";
import { CityTrendChart } from "@/components/leaderboard/CityTrendChart";
import { WardLeaderboard } from "@/components/WardLeaderboard";

type Variant = "slowest" | "fastest";

interface LeaderboardTabsProps {
  slowest: LeaderboardEntry[];
  fastest: LeaderboardEntry[];
  updatedAt: string | null;
  /** Daily series for every ward shown in either tab. */
  history: WardHistoryBundle;
  cityHistory: CityHistoryPoint[];
}

interface VariantCopy {
  kicker: string;
  headline: string;
  lede: React.ReactNode;
  tabLabel: string;
  footnote: React.ReactNode;
  /** color token applied to the kicker square + active tab underline. */
  accentBg: string;
  /** color token applied to the active tab label. */
  accentText: string;
}

const COPY: Record<Variant, VariantCopy> = {
  slowest: {
    kicker: "Ward Accountability Index",
    headline: "The wards where potholes wait longest.",
    lede: (
      <>
        The ten worst-performing wards, ranked by how long they actually take to
        fix a pothole &mdash; the median time from report to repair over the
        last 30 days.
      </>
    ),
    tabLabel: "Slowest 10",
    accentBg: "bg-cone",
    accentText: "text-cone",
    footnote: (
      <>
        Why rank by median time-to-fix instead of raw counts or the share past
        target? Counts favor wards with more engaged residents, and SLA
        percentages swing wildly when a ward&apos;s open backlog is small.
      </>
    ),
  },
  fastest: {
    kicker: "Ward Honor Roll",
    headline: "The wards where potholes get fixed fastest.",
    lede: (
      <>
        The ten best-performing wards, ranked by how quickly they actually close
        a pothole &mdash; the median time from report to repair over the last
        30 days. The city&apos;s stated target is seven days; these wards beat
        it the most decisively.
      </>
    ),
    tabLabel: "Fastest 10",
    accentBg: "bg-ice",
    accentText: "text-ice",
    footnote: (
      <>
        A faster median doesn&apos;t always mean a healthier ward &mdash; small
        open backlogs and lighter reporting volume can compress the distribution.
        Pair this view with the slowest-10 to see the full spread.
      </>
    ),
  },
};

export function LeaderboardTabs({
  slowest,
  fastest,
  updatedAt,
  history,
  cityHistory,
}: LeaderboardTabsProps) {
  const [variant, setVariant] = useState<Variant>("slowest");
  const tablistId = useId();
  const panelId = useId();

  const copy = COPY[variant];
  const entries = variant === "slowest" ? slowest : fastest;
  const refreshedLine = updatedAt
    ? `As of ${formatRefreshedAt(updatedAt)} — `
    : "";

  return (
    <>
      <section className="px-6 pt-16 pb-10 sm:pt-24">
        <div className="mx-auto max-w-5xl">
          <div
            className="reveal flex items-center gap-4"
            style={{ animationDelay: "40ms" }}
          >
            <span
              key={`kicker-square-${variant}`}
              className={cn(
                "size-2.5 shrink-0 transition-colors",
                copy.accentBg,
              )}
            />
            <span
              key={`kicker-label-${variant}`}
              className="font-mono text-xs tracking-[0.25em] text-paint-dim uppercase"
            >
              {copy.kicker}
            </span>
            <span className="h-px flex-1 bg-curb" />
          </div>

          <h1
            key={`headline-${variant}`}
            className="reveal mt-8 max-w-3xl font-display text-[clamp(3rem,9vw,6.5rem)] leading-[0.86] tracking-tight text-paint uppercase"
            style={{ animationDelay: "120ms" }}
          >
            {copy.headline}
          </h1>

          <p
            key={`lede-${variant}`}
            className="reveal mt-7 max-w-2xl text-lg leading-relaxed text-paint-dim"
            style={{ animationDelay: "220ms" }}
          >
            {copy.lede}
          </p>

          <p
            className="reveal mt-6 font-mono text-[0.7rem] tracking-[0.12em] text-paint-dim/70 uppercase"
            style={{ animationDelay: "300ms" }}
          >
            {refreshedLine}data refreshed daily from Chicago 311.
          </p>
        </div>
      </section>

      {cityHistory.length > 0 && (
        <section className="border-y border-curb bg-aggregate px-6 py-16">
          <div className="mx-auto max-w-5xl">
            <SectionHeading label="The city, day by day" />
            <div className="mt-10">
              <CityTrendChart points={cityHistory} />
            </div>
          </div>
        </section>
      )}

      <section className="px-6 pt-20 pb-24">
        <div className="mx-auto max-w-5xl">
          <div
            role="tablist"
            aria-label="Leaderboard view"
            id={tablistId}
            className="reveal mb-10 flex items-end gap-8 border-b border-curb sm:gap-12"
            style={{ animationDelay: "360ms" }}
          >
            {(Object.keys(COPY) as Variant[]).map((key) => {
              const tabCopy = COPY[key];
              const isActive = key === variant;
              return (
                <button
                  key={key}
                  role="tab"
                  type="button"
                  aria-selected={isActive}
                  aria-controls={panelId}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => setVariant(key)}
                  className={cn(
                    "group relative -mb-px flex items-center gap-3 pt-3 pb-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ice",
                    isActive
                      ? "cursor-default"
                      : "cursor-pointer",
                  )}
                >
                  {/* Tiny square echoing the kicker rule above — solid when
                      active, hollow when not, so the eye picks the live tab
                      without needing a redundant count badge. */}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "size-2 shrink-0 transition-all",
                      isActive
                        ? tabCopy.accentBg
                        : "border border-paint-dim bg-transparent group-hover:border-paint",
                    )}
                  />
                  <span
                    className={cn(
                      "font-display text-2xl leading-none tracking-tight uppercase transition-colors sm:text-3xl",
                      isActive
                        ? "text-paint"
                        : "text-paint-dim/70 group-hover:text-paint",
                    )}
                  >
                    {tabCopy.tabLabel}
                  </span>
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute right-0 bottom-0 left-0 h-[2px] origin-left transition-transform duration-300 ease-out",
                      tabCopy.accentBg,
                      isActive ? "scale-x-100" : "scale-x-0",
                    )}
                  />
                </button>
              );
            })}
          </div>

          <div
            id={panelId}
            role="tabpanel"
            aria-labelledby={tablistId}
            // Re-key on variant change so the staggered reveal + bar draw
            // animations replay each time the user toggles tabs.
            key={variant}
          >
            <WardLeaderboard
              entries={entries}
              variant={variant}
              history={history}
            />
          </div>

          <p className="mt-14 max-w-xl text-sm leading-relaxed text-paint-dim">
            {copy.footnote}{" "}
            <Link
              href="/methodology"
              className="rounded-sm font-medium text-paint underline decoration-paint/30 underline-offset-4 transition-colors hover:text-cone focus-visible:ring-2 focus-visible:ring-ice focus-visible:outline-none"
            >
              Read the methodology
            </Link>
            .
          </p>
        </div>
      </section>
    </>
  );
}
