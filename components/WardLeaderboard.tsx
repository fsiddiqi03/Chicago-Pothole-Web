"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

import type { LeaderboardEntry } from "@/types/dashboard";
import type { WardHistoryBundle } from "@/lib/ward-history";
import { formatDecimal, formatInt, pad2 } from "@/lib/format";
import { cn } from "@/lib/utils";
import { WardDetailChart } from "@/components/leaderboard/WardDetailChart";
import { WardSparkline } from "@/components/leaderboard/WardSparkline";

export type LeaderboardVariant = "slowest" | "fastest";

const SLA_DAYS = 7;
const MARK_ICE = "#41b6e6";
const MARK_CONE = "#ff5f2e";

interface WardLeaderboardProps {
  entries: LeaderboardEntry[];
  variant?: LeaderboardVariant;
  history: WardHistoryBundle;
}

/** pg returns numeric columns as strings; coerce to a finite number or null. */
function toNumber(value: string | null): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

// 7 days is the city's stated target. For the slowest view, 30 days (>4x the
// target) is a full bar so the worst offenders dominate even when medians
// cluster. For the fastest view we invert against the target so wards that beat
// it most decisively have the longest bars.
function computeBarWidth(
  median: number | null,
  variant: LeaderboardVariant,
): number {
  if (median == null) return 0;
  if (variant === "slowest") {
    return Math.min(1, Math.max(0, median / 30)) * 100;
  }
  return (1 - Math.min(1, Math.max(0, median / SLA_DAYS))) * 100;
}

function seriesStats(medians: (number | null)[]) {
  const present = medians.filter((v): v is number => v != null);
  if (present.length === 0) return null;
  return {
    first: present[0],
    last: present[present.length - 1],
    min: Math.min(...present),
    max: Math.max(...present),
    delta: present[present.length - 1] - present[0],
  };
}

function shortDate(iso: string | undefined): string {
  if (!iso) return "";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function WardLeaderboard({
  entries,
  variant = "slowest",
  history,
}: WardLeaderboardProps) {
  const [expanded, setExpanded] = useState<number | null>(null);

  if (entries.length === 0) {
    return (
      <p className="border-t border-curb pt-8 font-mono text-sm text-paint-dim">
        {variant === "slowest"
          ? "The leaderboard is refreshing — check back shortly."
          : "The honour roll is refreshing — check back shortly."}
      </p>
    );
  }

  const windowStart = shortDate(history.dates[0]);

  return (
    <div>
      <ol className="border-t border-curb">
        {entries.map((entry, i) => {
          const rank = i + 1;
          const median = toNumber(entry.median_days_to_fix);
          const pct = toNumber(entry.pct_over_sla);
          const barWidth = computeBarWidth(median, variant);
          const series = history.series[entry.ward_id];
          const stats = series ? seriesStats(series.medians) : null;
          const isOpen = expanded === entry.ward_id;
          const meetsTarget = median != null && median <= SLA_DAYS;
          // Colour follows the ward's own standing against the target, never
          // its rank — switching tabs must not repaint the wards that survive.
          const markColor = meetsTarget ? MARK_ICE : MARK_CONE;
          const panelId = `ward-detail-${entry.ward_id}`;

          return (
            <li key={entry.ward_id} className="border-b border-curb">
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setExpanded(isOpen ? null : entry.ward_id)}
                className="group grid w-full grid-cols-[2.5rem_1fr] items-center gap-x-4 py-6 text-left transition-colors hover:bg-aggregate/60 focus-visible:ring-2 focus-visible:ring-ice focus-visible:outline-none sm:grid-cols-[3rem_1fr_10rem_8rem_2rem] sm:gap-x-6"
              >
                <span
                  className={cn(
                    "self-start pt-1 font-mono text-sm tabular-nums sm:self-center sm:pt-0 sm:text-base",
                    rank === 1 ? "text-hazard" : "text-paint-dim/70",
                  )}
                >
                  {pad2(rank)}
                </span>

                <span className="min-w-0">
                  <span className="flex items-baseline justify-between gap-4 sm:block">
                    <span className="font-display text-3xl leading-none tracking-tight text-paint uppercase sm:text-[2.25rem]">
                      Ward {entry.ward_id}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 font-mono text-2xl tabular-nums sm:hidden",
                        meetsTarget ? "text-ice" : "text-cone-ink",
                      )}
                    >
                      {median == null ? "—" : formatDecimal(median)}
                    </span>
                  </span>
                  <span className="mt-1.5 block truncate text-sm text-paint-dim">
                    {entry.current_alderman
                      ? `Ald. ${entry.current_alderman}`
                      : "Alderperson not listed"}
                  </span>
                  <span className="mt-3.5 block h-1.5 w-full bg-curb">
                    <span
                      className={cn(
                        "draw-rule block h-full",
                        meetsTarget ? "bg-ice" : "bg-cone",
                      )}
                      style={{
                        width: `${barWidth}%`,
                        animationDelay: `${i * 60 + 180}ms`,
                      }}
                    />
                  </span>
                  <span className="mt-2.5 block font-mono text-[0.7rem] tracking-[0.08em] text-paint-dim uppercase">
                    <span className="text-paint">
                      {formatInt(entry.open_count)}
                    </span>{" "}
                    open ·{" "}
                    <span className="text-paint">
                      {pct == null ? "—" : `${formatDecimal(pct)}%`}
                    </span>{" "}
                    past target
                  </span>
                </span>

                {/* Trend column — shape only; the figure beside it is magnitude. */}
                <span className="hidden flex-col gap-1.5 sm:flex">
                  {series && (
                    <WardSparkline values={series.medians} stroke={markColor} />
                  )}
                  {stats && (
                    <span className="font-mono text-[0.65rem] tracking-[0.1em] text-paint-dim uppercase tabular-nums">
                      {stats.delta >= 0 ? "+" : "−"}
                      {formatDecimal(Math.abs(stats.delta))} d since{" "}
                      {windowStart}
                    </span>
                  )}
                </span>

                <span className="hidden text-right sm:block">
                  <span
                    className={cn(
                      "block font-mono text-[2.25rem] leading-none tabular-nums",
                      meetsTarget ? "text-ice" : "text-cone-ink",
                    )}
                  >
                    {median == null ? "—" : formatDecimal(median)}
                  </span>
                  <span className="mt-2 block font-mono text-[0.6rem] tracking-[0.15em] text-paint-dim uppercase">
                    median days to fix
                  </span>
                </span>

                <ChevronDown
                  aria-hidden="true"
                  className={cn(
                    "hidden size-5 shrink-0 justify-self-end text-paint-dim transition-transform group-hover:text-hazard sm:block",
                    isOpen && "rotate-180",
                  )}
                />
              </button>

              {isOpen && (
                <div id={panelId} className="pb-10">
                  <div className="grid grid-cols-1 gap-x-12 gap-y-8 border-t border-curb pt-8 lg:grid-cols-[1.4fr_1fr]">
                    <div>
                      <p className="mb-4 font-mono text-[0.65rem] tracking-[0.2em] text-hazard uppercase">
                        Ward {entry.ward_id} · median days to fix
                      </p>
                      {series ? (
                        <WardDetailChart
                          dates={history.dates}
                          medians={series.medians}
                          opens={series.opens}
                        />
                      ) : (
                        <p className="font-mono text-sm text-paint-dim">
                          No recorded history for this ward yet.
                        </p>
                      )}
                    </div>

                    <dl className="grid grid-cols-2 gap-x-8 gap-y-6 self-start">
                      <Figure
                        label="Best day"
                        value={stats ? `${formatDecimal(stats.min)} d` : "—"}
                      />
                      <Figure
                        label="Worst day"
                        value={stats ? `${formatDecimal(stats.max)} d` : "—"}
                      />
                      <Figure
                        label={`Change since ${windowStart}`}
                        value={
                          stats
                            ? `${stats.delta >= 0 ? "+" : "−"}${formatDecimal(
                                Math.abs(stats.delta),
                              )} d`
                            : "—"
                        }
                      />
                      <Figure
                        label="Open right now"
                        value={formatInt(entry.open_count)}
                      />
                      <div className="col-span-2">
                        <Link
                          href={`/map?ward=${entry.ward_id}`}
                          className="inline-flex items-center gap-2 border-b border-hazard/40 pb-1 font-mono text-xs tracking-[0.18em] text-hazard uppercase transition-colors hover:border-hazard focus-visible:ring-2 focus-visible:ring-ice focus-visible:outline-none"
                        >
                          See Ward {entry.ward_id} on the map
                          <span aria-hidden="true">&rarr;</span>
                        </Link>
                      </div>
                    </dl>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ol>

      <p className="mt-6 font-mono text-[0.65rem] tracking-[0.14em] text-paint-dim/70 uppercase">
        Trend lines show each ward&apos;s own range, so heights are not
        comparable between rows. Select a ward for its full history.
      </p>
    </div>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col-reverse gap-1.5">
      <dt className="font-mono text-[0.6rem] leading-relaxed tracking-[0.15em] text-paint-dim uppercase">
        {label}
      </dt>
      <dd className="font-mono text-xl text-paint tabular-nums">{value}</dd>
    </div>
  );
}
