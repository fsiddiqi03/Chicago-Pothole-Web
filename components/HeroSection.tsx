"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";

import type { OldestOpenPothole } from "@/types/dashboard";
import { formatReportDate, titleCase } from "@/lib/format";
import { OldestPotholeCounter } from "@/components/OldestPotholeCounter";

interface HeroSectionProps {
  pothole: OldestOpenPothole | null;
  /** Server-captured epoch ms, threaded down to the counter. */
  now: number;
}

export function HeroSection({ pothole, now }: HeroSectionProps) {
  const [opacity, setOpacity] = useState(1);

  // Fade the whole hero out as it scrolls away: fully visible at the top,
  // transparent once the user has scrolled one viewport. Opacity only — no
  // position changes — so we never fight the user's scroll. rAF throttles it.
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const viewport = window.innerHeight || 1;
      setOpacity(Math.max(0, 1 - window.scrollY / viewport));
    };
    const onScroll = () => {
      if (frame === 0) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section
      style={{ opacity, willChange: "opacity" }}
      className="flex min-h-[calc(100vh-4rem)] flex-col px-6 py-12"
    >
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div
          className="reveal flex max-w-xl items-center justify-center gap-4"
          style={{ animationDelay: "60ms" }}
        >
          <span className="hidden h-px w-10 bg-neutral-300 sm:block" />
          <p className="text-[0.7rem] font-medium tracking-[0.2em] text-neutral-500 uppercase sm:text-xs">
            As of now, Chicago&apos;s oldest open pothole has been waiting
          </p>
          <span className="hidden h-px w-10 bg-neutral-300 sm:block" />
        </div>

        <div className="reveal mt-10" style={{ animationDelay: "180ms" }}>
          {pothole ? (
            <OldestPotholeCounter createdAt={pothole.created_at} now={now} />
          ) : (
            <div className="flex flex-col items-center">
              <p className="font-mono text-8xl leading-none font-black text-chicago-red sm:text-9xl">
                &mdash;
              </p>
              <p className="mt-5 font-display text-xl italic text-neutral-600">
                Data unavailable
              </p>
            </div>
          )}
        </div>

        {pothole && (
          <div className="reveal mt-12" style={{ animationDelay: "380ms" }}>
            <p className="font-display text-2xl italic text-ink sm:text-3xl">
              {titleCase(pothole.street_address)}
            </p>
            <p className="mt-3 font-mono text-[0.7rem] tracking-[0.15em] text-neutral-500 uppercase">
              Ward {pothole.ward_id} &nbsp;&middot;&nbsp; Reported{" "}
              {formatReportDate(pothole.created_at)}
            </p>
          </div>
        )}
      </div>

      <div
        className="reveal flex flex-col items-center gap-2 pb-6 text-neutral-400"
        style={{ animationDelay: "620ms" }}
      >
        <span className="font-display text-sm italic">
          Scroll to see what this means
        </span>
        <ChevronDown className="size-5 animate-bounce" aria-hidden="true" />
      </div>
    </section>
  );
}
