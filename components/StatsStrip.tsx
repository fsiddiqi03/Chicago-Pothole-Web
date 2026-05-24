import type { CitySummary, SlaBreachCount } from "@/types/dashboard";
import { formatInt, formatDecimal, formatRefreshedAt } from "@/lib/format";
import { StatCard } from "@/components/StatCard";
import { SectionHeading } from "@/components/SectionHeading";

interface StatsStripProps {
  citySummary: CitySummary | null;
  slaBreach: SlaBreachCount | null;
  updatedAt: string | null;
}

export function StatsStrip({
  citySummary,
  slaBreach,
  updatedAt,
}: StatsStripProps) {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <SectionHeading numeral="01" label="By the numbers" />
        <h2 className="mt-6 mb-14 max-w-2xl font-display text-3xl tracking-tight text-ink sm:text-4xl">
          The state of the streets, measured against the city&apos;s own
          promises.
        </h2>
        <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            value={formatInt(citySummary?.total_open)}
            label="Open reports right now"
          />
          <StatCard
            value={formatInt(slaBreach?.count)}
            label="Past the city's 7-day target"
            accent="red"
          />
          <StatCard
            value={formatDecimal(citySummary?.avg_days_to_fix_30d)}
            label="Avg. days to fix (last 30d)"
          />
          <StatCard
            value={formatInt(citySummary?.closed_no_pothole_30d)}
            label="'Completed' with no repair (last 30d)"
            accent="red"
          />
        </div>
        <p className="mt-14 font-mono text-[0.7rem] tracking-[0.12em] text-neutral-400 uppercase">
          As of {formatRefreshedAt(updatedAt)} &mdash; data refreshed daily
          from Chicago 311.
        </p>
      </div>
    </section>
  );
}
