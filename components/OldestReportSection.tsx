import type { OpenPotholeRecord } from "@/types/dashboard";
import {
  elapsedBetween,
  formatInt,
  formatReportDate,
  formatRefreshedAt,
  titleCase,
} from "@/lib/format";
import { GuideSign } from "@/components/GuideSign";
import { LastReportedTimer } from "@/components/LastReportedTimer";
import { SectionHeading } from "@/components/SectionHeading";

interface OldestReportSectionProps {
  oldest: OpenPotholeRecord | null;
  latest: OpenPotholeRecord | null;
  updatedAt: string | null;
  /** Server-captured epoch ms, so both counters start from one clock. */
  now: number;
}

/**
 * One report, at human scale. The wall shows the distribution; this shows what
 * the far end of it looks like for a single street corner.
 */
export function OldestReportSection({
  oldest,
  latest,
  updatedAt,
  now,
}: OldestReportSectionProps) {
  // Whole days on the sign; the live counter beside it owns the ticking clock.
  const daysWaiting = oldest
    ? elapsedBetween(new Date(oldest.created_at).getTime(), now).days
    : null;

  return (
    <section className="border-t border-curb bg-aggregate px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <SectionHeading label="The longest wait" />

        {oldest ? (
          <div className="mt-10 grid grid-cols-1 gap-x-16 gap-y-10 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <p className="font-mono text-[0.65rem] tracking-[0.2em] text-paint-dim uppercase">
                Chicago&apos;s oldest open report
              </p>
              <h2 className="mt-5">
                <span className="sr-only">
                  {titleCase(oldest.street_address)}, Ward {oldest.ward_id} —
                  open {formatInt(daysWaiting)} days
                </span>
                <GuideSign
                  primary={titleCase(oldest.street_address)}
                  secondary={`Ward ${oldest.ward_id} · Ticket ${oldest.source_id}`}
                  measure={formatInt(daysWaiting)}
                  measureLabel="days"
                />
              </h2>
              <p className="mt-6 font-mono text-xs tracking-[0.14em] text-paint-dim uppercase">
                Reported {formatReportDate(oldest.created_at)}
              </p>
            </div>

            <div className="flex flex-col justify-end border-l-0 border-curb lg:border-l lg:pl-16">
              <p className="font-mono text-[0.65rem] tracking-[0.2em] text-cone uppercase">
                Open for
              </p>
              <div className="mt-4">
                <LastReportedTimer
                  createdAt={oldest.created_at}
                  now={now}
                  tone="cone"
                />
              </div>
              {latest && (
                <p className="mt-10 max-w-sm text-sm leading-relaxed text-paint-dim">
                  Meanwhile the newest report just came in at{" "}
                  <span className="text-paint">
                    {titleCase(latest.street_address)}
                  </span>
                  , in Ward {latest.ward_id}.
                </p>
              )}
            </div>
          </div>
        ) : (
          <p className="mt-10 font-mono text-sm text-paint-dim">
            Report details are refreshing. Check back shortly.
          </p>
        )}

        <p className="mt-16 font-mono text-[0.65rem] tracking-[0.14em] text-paint-dim/70 uppercase">
          As of {formatRefreshedAt(updatedAt)} · refreshed daily from Chicago
          311
        </p>
      </div>
    </section>
  );
}
