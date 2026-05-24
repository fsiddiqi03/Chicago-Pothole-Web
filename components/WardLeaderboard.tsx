import type { LeaderboardEntry } from "@/types/dashboard";
import { formatDecimal, formatInt, pad2 } from "@/lib/format";
import { cn } from "@/lib/utils";

interface WardLeaderboardProps {
  entries: LeaderboardEntry[];
}

/** pg returns numeric columns as strings; coerce to a finite number or null. */
function toNumber(value: string | null): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function WardLeaderboard({ entries }: WardLeaderboardProps) {
  if (entries.length === 0) {
    return (
      <p className="border-t border-neutral-300 pt-8 font-display text-xl italic text-neutral-500">
        The leaderboard is refreshing &mdash; check back shortly.
      </p>
    );
  }

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
          // 30 days = full bar; anything slower clamps to 100%. The city's
          // stated target is 7 days, so 30 is already >4× the SLA — finer
          // resolution past that point isn't meaningful.
          const barWidth =
            median == null ? 0 : Math.min(1, Math.max(0, median / 30)) * 100;
          const isWorst = rank === 1;

          return (
            <li
              key={entry.ward_id}
              className="reveal border-t border-neutral-300"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <div className="grid grid-cols-[2rem_1fr] items-start gap-x-4 py-7 sm:grid-cols-[3rem_1fr_9rem] sm:items-center sm:gap-x-8">
                {/* Rank — the worst offender's numeral is marked in red. */}
                <span
                  className={cn(
                    "pt-1 font-mono text-sm tabular-nums sm:pt-0 sm:text-lg",
                    isWorst ? "text-chicago-red" : "text-neutral-400",
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
                    <span className="shrink-0 font-mono text-2xl font-semibold tabular-nums text-chicago-red sm:hidden">
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
                      className="draw-rule h-full bg-chicago-red"
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
                      {pct == null ? "—" : formatDecimal(pct, 1)}%
                    </span>{" "}
                    past 7-day target
                  </p>
                </div>

                {/* Headline metric — desktop column. */}
                <div className="hidden text-right sm:block">
                  <div className="font-mono text-[2.5rem] leading-none font-semibold tracking-tight text-chicago-red tabular-nums">
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
