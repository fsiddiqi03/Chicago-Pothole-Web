import Link from "next/link";

import type { LeaderboardEntry } from "@/types/dashboard";
import { formatDecimal } from "@/lib/format";
import { cn } from "@/lib/utils";
import { WardWallScroller } from "@/components/WardWallScroller";

/** The city's stated turnaround for a pothole. */
export const SLA_DAYS = 7;

/** Chicago has had exactly 50 wards since 1923. */
const CHICAGO_WARDS = 50;

interface WardWallProps {
  /** Every ward that has a median. Order doesn't matter; the wall sorts. */
  wards: LeaderboardEntry[];
}

interface PlottedWard {
  wardId: number;
  alderman: string | null;
  median: number;
}

/** pg returns numeric columns as strings; coerce to a finite number or null. */
function toNumber(value: string | null): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * Two states only, matching the map's legend exactly: a ward either finishes
 * inside the city's target or it doesn't. Extra bands would invent thresholds
 * the city never committed to.
 */
function bandOf(median: number): { bar: string; text: string } {
  return median <= SLA_DAYS
    ? { bar: "bg-ice", text: "text-ice" }
    : { bar: "bg-cone", text: "text-cone" };
}

/**
 * One bar per ward that has a median, sorted fastest to slowest, with the
 * city's 7-day target drawn across them. Sorting by speed rather than ward
 * number turns the target line into a countable crossing point: you can see
 * exactly how many wards sit under it. Each bar links to that ward on the map.
 */
export function WardWall({ wards }: WardWallProps) {
  const plotted: PlottedWard[] = wards
    .map((w) => ({
      wardId: w.ward_id,
      alderman: w.current_alderman,
      median: toNumber(w.median_days_to_fix),
    }))
    .filter((w): w is PlottedWard => w.median != null)
    .sort((a, b) => a.median - b.median);

  if (plotted.length === 0) {
    return (
      <p className="border-t border-curb pt-6 font-mono text-sm text-paint-dim">
        Ward figures are refreshing. Check back shortly.
      </p>
    );
  }

  const slowest = plotted[plotted.length - 1];
  const fastest = plotted[0];
  const max = slowest.median;
  const meeting = plotted.filter((w) => w.median <= SLA_DAYS).length;
  const targetPct = (SLA_DAYS / max) * 100;
  // Wards with no completed repair in the window have no median to plot. Say so
  // rather than letting the wall imply all fifty are represented.
  const omitted = Math.max(0, CHICAGO_WARDS - plotted.length);
  // The scroller can't know how many bars are off-screen, so name the worst
  // ward instead — it's the reason to keep scrolling.
  const offscreenHint = `Ward ${slowest.wardId}`;

  return (
    <figure className="mt-0">
      {/* Orientation stays outside the scroller so it is legible before any
          scrolling happens — otherwise the short left-hand bars read as the
          whole story. */}
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 font-mono text-[0.65rem] tracking-[0.14em] text-paint-dim uppercase">
        <span>{plotted.length} wards · fastest to slowest &rarr;</span>
        <span className="text-paint-dim/70">
          Bar height is median days to fix
        </span>
      </div>

      <WardWallScroller hint={`${offscreenHint} more`}>
        {/* The wall needs room to stay legible; on narrow screens it scrolls
            rather than compressing every ward into a sliver. */}
        <div className="relative min-w-[560px] pt-1">
          <div className="relative h-[clamp(190px,26vw,310px)] w-full">
            {/* The city's target, drawn across every ward. */}
            <div
              className="pointer-events-none absolute inset-x-0 z-20"
              style={{ bottom: `${targetPct}%` }}
            >
              <div
                className="draw-rule h-px w-full bg-hazard"
                style={{ animationDelay: "900ms" }}
              />
              <span className="absolute right-0 -top-6 bg-asphalt pl-3 font-mono text-[0.65rem] tracking-[0.18em] text-hazard uppercase">
                {SLA_DAYS}-day target
              </span>
            </div>

            <ol className="flex h-full items-end gap-px">
              {plotted.map((w, i) => {
                const band = bandOf(w.median);
                const heightPct = (w.median / max) * 100;
                // Keep the fastest wards visible as a stub rather than letting
                // a linear scale erase them.
                const edge =
                  i < 6 ? "left-0" : i > plotted.length - 7 ? "right-0" : "left-1/2 -translate-x-1/2";

                return (
                  <li
                    key={w.wardId}
                    className="group relative flex h-full min-w-0 flex-1"
                  >
                    <Link
                      href={`/map?ward=${w.wardId}`}
                      aria-label={`Ward ${w.wardId}${
                        w.alderman ? `, Ald. ${w.alderman}` : ""
                      }: median ${formatDecimal(w.median, 1)} days to fix. Show on the map.`}
                      className="relative flex h-full w-full items-end focus-visible:outline-none"
                    >
                      <span
                        aria-hidden="true"
                        className="absolute inset-0 transition-colors group-hover:bg-paint/10 group-focus-within:bg-paint/10"
                      />
                      <span
                        aria-hidden="true"
                        className={cn("rise-bar relative w-full", band.bar)}
                        style={{
                          height: `${heightPct}%`,
                          minHeight: "2px",
                          animationDelay: `${i * 14}ms`,
                        }}
                      />
                    </Link>

                    {/* Readout sits inside the plot area — the scroll container
                        would clip anything above it. */}
                    <span
                      className={cn(
                        "pointer-events-none absolute top-0 z-30 hidden whitespace-nowrap border border-curb bg-aggregate px-3 py-2 group-hover:block group-focus-within:block",
                        edge,
                      )}
                    >
                      <span className="block font-display text-xl leading-none tracking-tight text-paint uppercase">
                        Ward {w.wardId}
                      </span>
                      <span className="mt-1 block font-mono text-[0.65rem] tracking-[0.1em] text-paint-dim uppercase">
                        {w.alderman ? `Ald. ${w.alderman}` : "No alderperson listed"}
                      </span>
                      <span
                        className={cn(
                          "mt-1.5 block font-mono text-sm tabular-nums",
                          band.text,
                        )}
                      >
                        {formatDecimal(w.median, 1)} days
                      </span>
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="mt-2 h-px w-full bg-curb" />

          {/* End labels sit inside the scroller because they mark the ends of
              the wall itself. */}
          <div className="mt-3 flex items-baseline justify-between font-mono text-[0.65rem] tracking-[0.14em] text-paint-dim uppercase">
            <span>
              <span className="text-ice">Ward {fastest.wardId}</span> ·{" "}
              {formatDecimal(fastest.median, 1)} days
            </span>
            <span>
              <span className="text-cone-ink">Ward {slowest.wardId}</span> ·{" "}
              {formatDecimal(slowest.median, 1)} days
            </span>
          </div>
        </div>
      </WardWallScroller>

      <figcaption className="mt-6 max-w-2xl text-sm leading-relaxed text-paint-dim">
        Each bar is one ward&apos;s median time from report to repair over the
        last 30 days.{" "}
        <span className="text-paint">
          {meeting} of {plotted.length} wards
        </span>{" "}
        finish inside the city&apos;s {SLA_DAYS}-day target. Select a ward to
        see its open reports on the map.
        {omitted > 0 && (
          <>
            {" "}
            {omitted === 1 ? "One ward" : `${omitted} wards`} closed no repairs
            in the window and {omitted === 1 ? "is" : "are"} not plotted.
          </>
        )}
      </figcaption>
    </figure>
  );
}
