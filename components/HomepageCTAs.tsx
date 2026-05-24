import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { SectionHeading } from "@/components/SectionHeading";

interface CTA {
  href: string;
  index: string;
  title: string;
  subtext: string;
}

const CTAS: CTA[] = [
  {
    href: "/map",
    index: "A",
    title: "Explore the map",
    subtext: "See every open pothole in Chicago, color-coded by age.",
  },
  {
    href: "/leaderboard",
    index: "B",
    title: "See the leaderboard",
    subtext:
      "Which wards are slowest to respond — and which alderpersons represent them.",
  },
];

export function HomepageCTAs() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <SectionHeading numeral="03" label="Go deeper" />
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {CTAS.map((cta) => (
            <Link
              key={cta.href}
              href={cta.href}
              className="group relative flex flex-col justify-between gap-10 overflow-hidden rounded-sm border border-neutral-300 p-8 transition-colors hover:border-chicago-blue focus-visible:border-chicago-blue focus-visible:ring-2 focus-visible:ring-chicago-blue focus-visible:outline-none"
            >
              {/* Oversized faint index letter, like a section tab. */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -top-6 -right-2 font-display text-[7rem] leading-none text-neutral-200 transition-colors duration-300 group-hover:text-chicago-blue/30"
              >
                {cta.index}
              </span>
              <div className="relative">
                <h3 className="font-display text-2xl tracking-tight text-ink sm:text-3xl">
                  {cta.title}
                </h3>
                <p className="mt-3 max-w-xs text-base leading-relaxed text-neutral-600">
                  {cta.subtext}
                </p>
              </div>
              <span className="relative flex items-center gap-2 font-mono text-xs tracking-[0.2em] text-neutral-500 uppercase transition-colors group-hover:text-chicago-blue">
                View
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
