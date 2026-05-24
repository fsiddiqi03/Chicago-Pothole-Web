"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";

import type { OpenPotholeRecord } from "@/types/dashboard";
import { formatInt, formatReportDate, titleCase } from "@/lib/format";
import { LastReportedTimer } from "@/components/LastReportedTimer";

interface HeroSectionProps {
  /** Count of potholes open across the city right now — the hero figure. */
  openCount: number | null;
  /** Most recently reported open pothole, for the live "last reported" line. */
  latestReport: OpenPotholeRecord | null;
  /** Server-captured epoch ms, threaded down to the timer. */
  now: number;
}

export function HeroSection({ openCount, latestReport, now }: HeroSectionProps) {
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

  const hasCount = openCount != null;

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
            As of now, the city of Chicago has
          </p>
          <span className="hidden h-px w-10 bg-neutral-300 sm:block" />
        </div>

        <div className="reveal mt-10" style={{ animationDelay: "180ms" }}>
          {hasCount ? (
            <div className="flex flex-col items-center">
              {/* Sole <h1> on the page. Fluid size: fills small screens, caps
                  on desktop, and the vw term keeps even a 6-digit count inside
                  the viewport without wrapping. */}
              <h1
                style={{ fontSize: "clamp(5rem, 27vw, 11rem)" }}
                className="font-mono leading-[0.82] font-black tracking-tighter whitespace-nowrap text-chicago-red tabular-nums"
              >
                {formatInt(openCount)}
              </h1>
              <p className="mt-10 text-xs font-semibold tracking-[0.4em] text-neutral-500 uppercase">
                Open potholes
              </p>
            </div>
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

        {latestReport && (
          <div className="reveal mt-14" style={{ animationDelay: "380ms" }}>
            <div className="flex items-center justify-center gap-3">
              <span className="h-px w-8 bg-neutral-300" />
              <p className="font-mono text-[0.7rem] tracking-[0.2em] text-neutral-500 uppercase">
                Last reported
              </p>
              <span className="h-px w-8 bg-neutral-300" />
            </div>

            <div className="mt-5">
              <LastReportedTimer createdAt={latestReport.created_at} now={now} />
            </div>

            <p className="mt-8 font-display text-2xl italic text-ink sm:text-3xl">
              {titleCase(latestReport.street_address)}
            </p>
            <p className="mt-3 font-mono text-[0.7rem] tracking-[0.15em] text-neutral-500 uppercase">
              Ward {latestReport.ward_id} &nbsp;&middot;&nbsp; Reported{" "}
              {formatReportDate(latestReport.created_at)}
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
