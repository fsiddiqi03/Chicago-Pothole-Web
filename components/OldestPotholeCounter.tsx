"use client";

import { useEffect, useRef, useState } from "react";

import {
  elapsedBetween,
  pad2,
  describeElapsed,
  type Elapsed,
} from "@/lib/format";

interface OldestPotholeCounterProps {
  /** ISO 8601 timestamp the pothole was reported. */
  createdAt: string;
  /** Server-captured epoch ms, used for the first render so the server and
   *  client agree and React doesn't warn about a hydration mismatch. */
  now: number;
}

export function OldestPotholeCounter({
  createdAt,
  now,
}: OldestPotholeCounterProps) {
  const createdMs = new Date(createdAt).getTime();

  // Initial state derives from the server's `now`, so SSR and first client
  // render match. The interval below switches to the live clock after mount.
  const [elapsed, setElapsed] = useState<Elapsed>(() =>
    elapsedBetween(createdMs, now),
  );
  const [label, setLabel] = useState<string>(() =>
    describeElapsed(elapsedBetween(createdMs, now)),
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
        setLabel(describeElapsed(next));
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [createdMs]);

  return (
    <div role="timer" aria-label={label} className="flex flex-col items-center">
      {/* Sole <h1> on the page. min-h reserves the line so ticking can't shift layout. */}
      <h1 className="min-h-[0.9em] font-mono text-[6.5rem] leading-[0.85] font-black tracking-tighter text-chicago-red tabular-nums sm:text-[10rem] lg:text-[12rem]">
        {elapsed.days.toLocaleString("en-US")}
      </h1>
      <p className="mt-4 text-xs font-semibold tracking-[0.4em] text-neutral-500 uppercase">
        Days
      </p>
      <div className="mt-6 flex items-center gap-3">
        <span className="h-px w-8 bg-neutral-300" />
        <p className="font-mono text-xl tracking-wide tabular-nums sm:text-2xl">
          <span className="text-ink">{elapsed.hours}</span>
          <span className="text-neutral-400">h</span>{" "}
          <span className="text-ink">{pad2(elapsed.minutes)}</span>
          <span className="text-neutral-400">m</span>{" "}
          <span className="text-ink">{pad2(elapsed.seconds)}</span>
          <span className="text-neutral-400">s</span>
        </p>
        <span className="h-px w-8 bg-neutral-300" />
      </div>
    </div>
  );
}
