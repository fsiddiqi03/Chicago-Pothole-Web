"use client";

import { useEffect, useRef, useState } from "react";

import { elapsedBetween, pad2, describeSinceReport } from "@/lib/format";

const TONES = {
  cone: "text-cone",
  hazard: "text-hazard",
  ice: "text-ice",
  paint: "text-paint",
} as const;

interface LastReportedTimerProps {
  /** ISO 8601 timestamp the report was created. */
  createdAt: string;
  /** Server-captured epoch ms, used for the first render so SSR and the first
   *  client render agree and React doesn't warn about a hydration mismatch. */
  now: number;
  tone?: keyof typeof TONES;
}

/**
 * Live "how long ago" counter, as days / hours / minutes / seconds. The day
 * segment is dropped entirely when the gap is under 24 hours so it doesn't show
 * a redundant "0d".
 */
export function LastReportedTimer({
  createdAt,
  now,
  tone = "hazard",
}: LastReportedTimerProps) {
  const createdMs = new Date(createdAt).getTime();

  const [elapsed, setElapsed] = useState(() => elapsedBetween(createdMs, now));
  const [label, setLabel] = useState(() =>
    describeSinceReport(elapsedBetween(createdMs, now)),
  );
  const lastMinuteRef = useRef<number>(-1);

  useEffect(() => {
    const tick = () => {
      const next = elapsedBetween(createdMs, Date.now());
      setElapsed(next);

      // Refresh the spoken label only when the minute changes, so assistive
      // tech isn't churning a new value every second.
      const minuteKey = next.days * 1440 + next.hours * 60 + next.minutes;
      if (minuteKey !== lastMinuteRef.current) {
        lastMinuteRef.current = minuteKey;
        setLabel(describeSinceReport(next));
      }
    };
    tick();
    const id = setInterval(tick, 1000);

    // Mobile browsers freeze timers while the tab is backgrounded (screen
    // locked, app switched). Recompute the moment we're visible again so the
    // counter snaps to the real elapsed time instead of resuming where it
    // paused — otherwise it only looks "stuck until refresh".
    const resync = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", resync);
    window.addEventListener("pageshow", resync);
    window.addEventListener("focus", resync);

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", resync);
      window.removeEventListener("pageshow", resync);
      window.removeEventListener("focus", resync);
    };
  }, [createdMs]);

  const accent = TONES[tone];

  return (
    <p
      role="timer"
      aria-label={label}
      className="font-mono text-3xl tracking-tight tabular-nums sm:text-4xl"
    >
      {elapsed.days > 0 && (
        <>
          <span className={accent}>{elapsed.days}</span>
          <span className="text-paint-dim/60">d</span>{" "}
        </>
      )}
      <span className={accent}>{pad2(elapsed.hours)}</span>
      <span className="text-paint-dim/60">h</span>{" "}
      <span className={accent}>{pad2(elapsed.minutes)}</span>
      <span className="text-paint-dim/60">m</span>{" "}
      <span className={accent}>{pad2(elapsed.seconds)}</span>
      <span className="text-paint-dim/60">s</span>
    </p>
  );
}
