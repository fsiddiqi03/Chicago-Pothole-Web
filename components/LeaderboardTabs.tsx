"use client";

import Link from "next/link";
import { useId, useState } from "react";

import type { LeaderboardEntry } from "@/types/dashboard";
import { cn } from "@/lib/utils";
import { formatRefreshedAt } from "@/lib/format";
import { WardLeaderboard } from "@/components/WardLeaderboard";

type Variant = "slowest" | "fastest";

interface LeaderboardTabsProps {
  slowest: LeaderboardEntry[];
  fastest: LeaderboardEntry[];
  updatedAt: string | null;
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
    accentBg: "bg-chicago-red",
    accentText: "text-chicago-red",
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
    accentBg: "bg-chicago-blue",
    accentText: "text-chicago-blue",
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
              className="font-mono text-xs tracking-[0.25em] text-neutral-500 uppercase"
            >
              {copy.kicker}
            </span>
            <span className="h-px flex-1 bg-neutral-300" />
          </div>

          <h1
            key={`headline-${variant}`}
            className="reveal mt-8 max-w-3xl font-display text-5xl leading-[0.98] tracking-tight text-ink sm:text-7xl"
            style={{ animationDelay: "120ms" }}
          >
            {copy.headline}
          </h1>

          <p
            key={`lede-${variant}`}
            className="reveal mt-7 max-w-2xl text-lg leading-relaxed text-neutral-600"
            style={{ animationDelay: "220ms" }}
          >
            {copy.lede}
          </p>

          <p
            className="reveal mt-6 font-mono text-[0.7rem] tracking-[0.12em] text-neutral-400 uppercase"
            style={{ animationDelay: "300ms" }}
          >
            {refreshedLine}data refreshed daily from Chicago 311.
          </p>
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="mx-auto max-w-5xl">
          <div
            role="tablist"
            aria-label="Leaderboard view"
            id={tablistId}
            className="reveal mb-10 flex items-end gap-8 border-b border-neutral-300 sm:gap-12"
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
                    "group relative -mb-px flex items-center gap-3 pt-3 pb-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chicago-blue",
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
                        : "border border-neutral-400 bg-transparent group-hover:border-ink",
                    )}
                  />
                  <span
                    className={cn(
                      "font-display text-xl tracking-tight transition-colors sm:text-2xl",
                      isActive
                        ? "text-ink"
                        : "text-neutral-400 group-hover:text-neutral-700",
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
            <WardLeaderboard entries={entries} variant={variant} />
          </div>

          <p className="mt-14 max-w-xl text-sm leading-relaxed text-neutral-500">
            {copy.footnote}{" "}
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
    </>
  );
}
