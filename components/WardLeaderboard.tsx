import type { LeaderboardEntry } from "@/types/dashboard";
import { formatDecimal, formatInt, pad2 } from "@/lib/format";
import { cn } from "@/lib/utils";

export type LeaderboardVariant = "slowest" | "fastest";

interface WardLeaderboardProps {
  entries: LeaderboardEntry[];
  variant?: LeaderboardVariant;
}

/** pg returns numeric columns as strings; coerce to a finite number or null. */
function toNumber(value: string | null): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

// 7 days is the city's stated SLA target. For the slowest view, we want the
// worst offenders' bars to dominate even when medians cluster in the teens,
// so 30 days (>4× target) is "full bar". For the fastest view, we invert
// against the 7-day target so wards that beat it most decisively have the
// longest bars — and the variance across the top-10 fastest stays legible.
function computeBarWidth(
  median: number | null,
  variant: LeaderboardVariant,
): number {
  if (median == null) return 0;
  if (variant === "slowest") {
    return Math.min(1, Math.max(0, median / 30)) * 100;
  }
  return (1 - Math.min(1, Math.max(0, median / 7))) * 100;
}

export function WardLeaderboard({
  entries,
  variant = "slowest",
}: WardLeaderboardProps) {
  if (entries.length === 0) {
    return (
      <p className="border-t border-neutral-300 pt-8 font-display text-xl italic text-neutral-500">
        {variant === "slowest"
          ? "The leaderboard is refreshing — check back shortly."
          : "The honor roll is refreshing — check back shortly."}
      </p>
    );
  }

  const isFastest = variant === "fastest";
  const accent = isFastest ? "text-chicago-blue" : "text-chicago-red";
  const accentBg = isFastest ? "bg-chicago-blue" : "bg-chicago-red";
  const supportingCopy = isFastest ? "under 7-day target" : "past 7-day target";

  return (
    <div>
      {/* Column header — desktop only; mobile rows carry their own inline labels. */}
      <div className="hidden grid-cols-[3rem_1fr_9rem] gap-x-8 pb-3 sm:grid">
        <span aria-hidden="true" />
      </div>

      <ol>
        {entries.map((entry, i) => {
          const rank = i + 1;
          const pct = toNumber(entry.pct_over_sla);
          const median = toNumber(entry.median_days_to_fix);
          const barWidth = computeBarWidth(median, variant);
          const isHighlight = rank === 1;
          // For the slowest view, the "pct past SLA" number is the relevant
          // supporting stat; for the fastest, we invert it so callers see how
          // much of the ward's work is being delivered inside the 7-day target.
          const supportingPct =
            pct == null ? null : isFastest ? 100 - pct : pct;

          return (
            <li
              key={entry.ward_id}
              className="reveal border-t border-neutral-300"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <div className="grid grid-cols-[2rem_1fr] items-start gap-x-4 py-7 sm:grid-cols-[3rem_1fr_9rem] sm:items-center sm:gap-x-8">
                {/* Rank — the headline entry's numeral is marked in the variant accent. */}
                <span
                  className={cn(
                    "pt-1 font-mono text-sm tabular-nums sm:pt-0 sm:text-lg",
                    isHighlight ? accent : "text-neutral-400",
                  )}
                >
                  {pad2(rank)}
                </span>

                {/* Ward, alderperson, days-to-fix bar, supporting counts. */}
                <div className="min-w-0">
                  <div className="flex items-baseline justify-between gap-4 sm:block">
                    <h2 className="font-display text-2xl tracking-tight text-ink sm:text-[1.75rem]">
                      Ward {entry.ward_id}
                    </h2>
                    {/* Mobile-only headline; desktop shows it in its own column. */}
                    <span
                      className={cn(
                        "shrink-0 font-mono text-2xl font-semibold tabular-nums sm:hidden",
                        accent,
                      )}
                    >
                      {median == null ? "—" : formatDecimal(median, 1)}
                      <span className="ml-1.5 align-baseline text-[0.65rem] font-medium tracking-[0.15em] uppercase">
                        days
                      </span>
                    </span>
                  </div>

                  <p className="mt-1 truncate text-sm text-neutral-500">
                    {entry.current_alderman
                      ? `Ald. ${entry.current_alderman}`
                      : "Alderperson not listed"}
                  </p>

                  <div className="mt-4 h-1.5 w-full overflow-hidden bg-neutral-200">
                    <div
                      className={cn("draw-rule h-full", accentBg)}
                      style={{
                        width: `${barWidth}%`,
                        animationDelay: `${i * 70 + 220}ms`,
                      }}
                    />
                  </div>

                  <p className="mt-2.5 font-mono text-[0.7rem] tracking-[0.08em] text-neutral-500 uppercase">
                    <span className="font-medium text-ink">
                      {formatInt(entry.open_count)}
                    </span>{" "}
                    open &middot;{" "}
                    <span className="font-medium text-ink">
                      {supportingPct == null
                        ? "—"
                        : `${formatDecimal(supportingPct, 1)}%`}
                    </span>{" "}
                    {supportingCopy}
                  </p>
                </div>

                {/* Headline metric — desktop column. */}
                <div className="hidden text-right sm:block">
                  <div
                    className={cn(
                      "font-mono text-[2.5rem] leading-none font-semibold tracking-tight tabular-nums",
                      accent,
                    )}
                  >
                    {median == null ? "—" : formatDecimal(median, 1)}
                    <span className="ml-2 align-top text-[0.7rem] font-medium tracking-[0.15em] uppercase">
                      days
                    </span>
                  </div>
                  <p className="mt-2 font-mono text-[0.6rem] tracking-[0.15em] text-neutral-500 uppercase">
                    median time to fix
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
