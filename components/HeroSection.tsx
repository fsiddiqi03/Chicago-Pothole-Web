import type { CitySummary, LeaderboardEntry } from "@/types/dashboard";
import { formatDecimal, formatInt } from "@/lib/format";
import { SLA_DAYS, WardWall } from "@/components/WardWall";

interface HeroSectionProps {
  citySummary: CitySummary | null;
  /** Every ward with a median, for the wall. */
  allWards: LeaderboardEntry[];
  /** Count of open reports past the city's target. */
  breachCount: number | null;
}

/**
 * The page opens on the argument rather than a headline figure: the city's
 * promise, the distance from it, and every ward measured against it.
 */
export function HeroSection({
  citySummary,
  allWards,
  breachCount,
}: HeroSectionProps) {
  const open = citySummary?.total_open ?? null;
  const avg = citySummary?.avg_days_to_fix_30d ?? null;
  const breachPct =
    breachCount != null && open != null && open > 0
      ? (breachCount / open) * 100
      : null;

  return (
    <section className="px-6 pt-16 pb-20 sm:pt-24">
      <div className="mx-auto max-w-6xl">
        <div
          className="reveal flex items-center gap-4"
          style={{ animationDelay: "40ms" }}
        >
          <span className="font-mono text-[0.65rem] tracking-[0.24em] text-hazard uppercase">
            Chicago 311 · Pothole repairs
          </span>
          <span className="lane-rule h-[3px] flex-1" />
        </div>

        <h1
          className="reveal mt-10 font-display text-[clamp(3.5rem,13vw,10.5rem)] leading-[0.82] tracking-[-0.02em] text-paint uppercase"
          style={{ animationDelay: "120ms" }}
        >
          Chicago says
          <br />
          <span className="text-hazard">seven days.</span>
        </h1>

        <p
          className="reveal mt-10 max-w-2xl text-lg leading-relaxed text-paint-dim"
          style={{ animationDelay: "240ms" }}
        >
          That is the city&apos;s stated target for filling a pothole once
          someone reports it.{" "}
          {avg != null && (
            <>
              Over the last 30 days the median repair took{" "}
              <span className="text-paint">{formatDecimal(avg)} days</span>.{" "}
            </>
          )}
          {breachPct != null && breachCount != null && (
            <>
              Of the reports open right now,{" "}
              <span className="text-cone">
                {formatDecimal(breachPct, 0)}%
              </span>{" "}
              are already past the target.{" "}
            </>
          )}
          Every ward is below, measured against the promise.
        </p>

        <div className="reveal mt-14" style={{ animationDelay: "360ms" }}>
          <WardWall wards={allWards} />
        </div>

        <dl
          className="reveal mt-14 grid grid-cols-2 gap-x-8 gap-y-8 border-t border-curb pt-8 sm:grid-cols-4"
          style={{ animationDelay: "480ms" }}
        >
          <HeroFigure
            value={formatInt(open)}
            label="Open right now"
            tone="paint"
          />
          <HeroFigure
            value={formatInt(breachCount)}
            label={`Past the ${SLA_DAYS}-day target`}
            tone="cone"
          />
          <HeroFigure
            value={formatDecimal(avg)}
            label="Median days to fix, last 30d"
            tone="hazard"
          />
          <HeroFigure
            value={formatInt(citySummary?.completed_30d)}
            label="Repairs completed, last 30d"
            tone="ice"
          />
        </dl>
      </div>
    </section>
  );
}

const TONES = {
  paint: "text-paint",
  cone: "text-cone",
  hazard: "text-hazard",
  ice: "text-ice",
} as const;

function HeroFigure({
  value,
  label,
  tone,
}: {
  value: string;
  label: string;
  tone: keyof typeof TONES;
}) {
  return (
    // A definition list must run dt-then-dd, so the pair is reversed with flex
    // rather than by putting the value first in the markup.
    <div className="flex flex-col-reverse gap-3">
      <dt className="font-mono text-[0.65rem] leading-relaxed tracking-[0.14em] text-paint-dim uppercase">
        {label}
      </dt>
      <dd
        className={`font-display text-[clamp(2.5rem,6vw,4rem)] leading-[0.85] tracking-tight tabular-nums ${TONES[tone]}`}
      >
        {value}
      </dd>
    </div>
  );
}
