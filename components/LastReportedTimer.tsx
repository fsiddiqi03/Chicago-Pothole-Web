"use client";

import { useEffect, useRef, useState } from "react";

import { elapsedBetween, pad2, describeSinceReport } from "@/lib/format";

interface LastReportedTimerProps {
  /** ISO 8601 timestamp the most recent open pothole was reported. */
  createdAt: string;
  /** Server-captured epoch ms, used for the first render so SSR and the first
   *  client render agree and React doesn't warn about a hydration mismatch. */
  now: number;
}

/**
 * Live "how long ago" timer for the most recent report. Chicago logs new
 * potholes many times a day, so days are folded into hours — the value reads
 * as hours / minutes / seconds and never rolls over to a day count.
 */
export function LastReportedTimer({ createdAt, now }: LastReportedTimerProps) {
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

  // Reports arrive daily; fold any days into the hour figure so the display
  // stays h / m / s as intended.
  const hours = elapsed.days * 24 + elapsed.hours;

  return (
    <p
      role="timer"
      aria-label={label}
      className="font-mono text-2xl tracking-wide tabular-nums sm:text-3xl"
    >
      <span className="text-chicago-red">{hours}</span>
      <span className="text-neutral-400">h</span>{" "}
      <span className="text-chicago-red">{pad2(elapsed.minutes)}</span>
      <span className="text-neutral-400">m</span>{" "}
      <span className="text-chicago-red">{pad2(elapsed.seconds)}</span>
      <span className="text-neutral-400">s</span>{" "}
      <span className="ml-1 font-sans text-base tracking-normal text-neutral-500 normal-case">
        ago
      </span>
    </p>
  );
}
