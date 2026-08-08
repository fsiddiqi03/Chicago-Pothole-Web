import Link from "next/link";

import { SectionHeading } from "@/components/SectionHeading";

interface SpecRow {
  term: string;
  detail: string;
}

// A public-works spec sheet rather than an essay: these are the choices that
// decide what every number on the site means.
const SPEC: SpecRow[] = [
  {
    term: "Source",
    detail:
      "The city's own 311 service requests, published as open data and pulled fresh every day.",
  },
  {
    term: "Measure",
    detail:
      "Median days from the moment a resident reports a pothole to the moment the city closes the ticket as repaired.",
  },
  {
    term: "Window",
    detail:
      "The trailing 30 days, so a ward's ranking reflects how it is working now rather than how it worked last winter.",
  },
  {
    term: "Target",
    detail:
      "Seven days. This is the city's stated commitment, not a threshold this site invented.",
  },
  {
    term: "Excluded",
    detail:
      "Duplicate tickets, which the city files separately when several people report the same hole.",
  },
];

export function MethodologySection() {
  return (
    <section className="border-t border-curb px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <SectionHeading label="How this is measured" />

        <div className="mt-10 grid grid-cols-1 gap-x-16 gap-y-12 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <h2 className="font-display text-[clamp(2.5rem,5.5vw,4.25rem)] leading-[0.88] tracking-tight text-paint uppercase">
              Ranked by how
              <br />
              <span className="text-hazard">long you wait.</span>
            </h2>
            <div className="mt-8 space-y-5 text-base leading-relaxed text-paint-dim">
              <p>
                Wards are ranked by median time to repair, not by how many
                potholes they report. Raw counts reward silence: a ward where
                nobody calls 311 looks pristine, and a ward with organised
                neighbours looks broken.
              </p>
              <p>
                Percentages past the target have the opposite problem. When a
                ward&apos;s open backlog is small, a handful of tickets swings
                the figure wildly from one day to the next. The median is
                harder to move by accident, and it answers the question people
                actually ask: if I report a pothole on my street, how long
                until someone fills it?
              </p>
              <p>
                This site is not affiliated with the City of Chicago. Where the
                city&apos;s data is strange, it is reported as-is rather than
                cleaned up.
              </p>
            </div>

            <Link
              href="/methodology"
              className="group mt-10 inline-flex items-center gap-3 border-b border-hazard/40 pb-1 font-mono text-xs tracking-[0.18em] text-hazard uppercase transition-colors hover:border-hazard focus-visible:ring-2 focus-visible:ring-ice focus-visible:outline-none"
            >
              Read the full methodology
              <span
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-1"
              >
                &rarr;
              </span>
            </Link>
          </div>

          <dl className="border-t border-curb">
            {SPEC.map((row) => (
              <div
                key={row.term}
                className="grid grid-cols-1 gap-x-8 gap-y-2 border-b border-curb py-6 sm:grid-cols-[7rem_1fr]"
              >
                <dt className="font-mono text-[0.65rem] tracking-[0.2em] text-hazard uppercase">
                  {row.term}
                </dt>
                <dd className="text-sm leading-relaxed text-paint-dim">
                  {row.detail}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
