import Link from "next/link";

import { SectionHeading } from "@/components/SectionHeading";

export function MethodologySection() {
  return (
    <section className="bg-chicago-blue-tint px-6 py-28">
      <div className="mx-auto max-w-3xl">
        <SectionHeading numeral="02" label="From the editors" />
        <h2 className="mt-6 font-display text-4xl tracking-tight text-ink sm:text-5xl">
          How we built this.
        </h2>

        <div className="mt-10 space-y-6 text-[1.05rem] leading-relaxed text-ink/85">
          {/* Drop cap opens the lede, magazine-style. */}
          <p className="first-letter:mr-3 first-letter:float-left first-letter:font-display first-letter:text-7xl first-letter:leading-[0.62] first-letter:font-semibold first-letter:text-chicago-red">
            The City of Chicago publishes all 311 pothole reports as open data.
            This site pulls a fresh copy every day, deduplicates the reports,
            and surfaces what the city&apos;s own dashboards don&apos;t: how
            long things actually take.
          </p>
          <p>
            We measure response time per ward, distinguishing real repairs from
            tickets the city closed without finding anything. Roughly 7% of
            &ldquo;completed&rdquo; tickets in the last 30 days were inspections
            that found nothing &mdash; the same number you see above.
          </p>
          <p>
            The leaderboard ranks wards by what percent of their currently-open
            tickets are past the city&apos;s stated 7-day target. We use this
            rather than raw counts because volume is biased: wards with more
            engaged residents report more, regardless of road condition.
          </p>
          <p>
            Some specific tickets defy normal interpretation. The Lake Shore
            Drive pothole shown above has been open in the city&apos;s system
            for over 500 days &mdash; likely a bureaucratic limbo between
            agencies, not literal neglect. We surface it because the city&apos;s
            data says it&apos;s open, and the city&apos;s data is what we work
            with.
          </p>
        </div>

        <Link
          href="/methodology"
          className="group mt-10 inline-flex items-center gap-2 rounded-sm font-display text-lg italic text-ink underline decoration-ink/30 underline-offset-4 transition-colors hover:text-chicago-red focus-visible:ring-2 focus-visible:ring-chicago-blue focus-visible:outline-none"
        >
          Read the full methodology
          <span className="transition-transform group-hover:translate-x-1">
            &rarr;
          </span>
        </Link>
      </div>
    </section>
  );
}
