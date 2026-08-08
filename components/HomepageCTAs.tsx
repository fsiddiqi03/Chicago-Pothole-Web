import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { SectionHeading } from "@/components/SectionHeading";

interface CTA {
  href: string;
  title: string;
  subtext: string;
}

const CTAS: CTA[] = [
  {
    href: "/map",
    title: "The map",
    subtext:
      "Every open report, pinned and coloured by how long it has been waiting. Filter to your ward.",
  },
  {
    href: "/leaderboard",
    title: "The leaderboard",
    subtext:
      "The ten slowest wards and the ten fastest, with the alderperson who represents each one.",
  },
];

export function HomepageCTAs() {
  return (
    <section className="relative overflow-hidden border-t border-curb px-6 py-24">
      {/* Lane arrow, painted on the surface. It points at the two ways forward
          from here, which is what the section is for. */}
      <svg
        aria-hidden="true"
        viewBox="0 0 120 220"
        className="pointer-events-none absolute -left-6 top-24 hidden h-[26rem] w-auto text-paint/[0.045] lg:block"
        fill="currentColor"
      >
        <path d="M60 0 L112 74 L78 74 L78 220 L42 220 L42 74 L8 74 Z" />
      </svg>

      <div className="relative mx-auto max-w-6xl">
        <SectionHeading label="Go deeper" />
        <div className="mt-10 grid grid-cols-1 gap-px bg-curb sm:grid-cols-2">
          {CTAS.map((cta) => (
            <Link
              key={cta.href}
              href={cta.href}
              className="group flex flex-col justify-between gap-12 bg-asphalt p-8 transition-colors hover:bg-aggregate focus-visible:ring-2 focus-visible:ring-ice focus-visible:outline-none sm:p-10"
            >
              <div>
                <h3 className="font-display text-[clamp(2.25rem,4.5vw,3.5rem)] leading-[0.9] tracking-tight text-paint uppercase transition-colors group-hover:text-hazard">
                  {cta.title}
                </h3>
                <p className="mt-4 max-w-sm text-sm leading-relaxed text-paint-dim">
                  {cta.subtext}
                </p>
              </div>
              <span className="flex items-center gap-2 font-mono text-[0.65rem] tracking-[0.2em] text-paint-dim uppercase transition-colors group-hover:text-hazard">
                Open
                <ArrowRight
                  aria-hidden="true"
                  className="size-4 transition-transform group-hover:translate-x-1"
                />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
