"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";

interface WardWallScrollerProps {
  children: React.ReactNode;
  /** Shown while there is more wall to the right, e.g. "31 more wards". */
  hint: string;
}

/**
 * Horizontal scroller with an explicit "there is more" affordance.
 *
 * The wall is sorted fastest-to-slowest, so a narrow screen opens on the
 * shortest bars and can read as a flat, broken chart. A fade plus a labelled
 * arrow says outright that the tall end is off to the right, and both disappear
 * once there is nothing left to scroll to.
 */
export function WardWallScroller({ children, hint }: WardWallScrollerProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      const remaining = el.scrollWidth - el.clientWidth - el.scrollLeft;
      setShowMore(el.scrollWidth - el.clientWidth > 8 && remaining > 8);
    };

    update();
    el.addEventListener("scroll", update, { passive: true });
    // The wall is fluid, so the overflow can appear or vanish on resize alone.
    const observer = new ResizeObserver(update);
    observer.observe(el);

    return () => {
      el.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, []);

  return (
    <div className="relative">
      <div ref={ref} className="overflow-x-auto">
        {children}
      </div>

      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-y-0 right-0 flex w-24 items-center justify-end bg-gradient-to-l from-asphalt via-asphalt/85 to-transparent pr-1 transition-opacity duration-300 ${
          showMore ? "opacity-100" : "opacity-0"
        }`}
      >
        <span className="flex flex-col items-center gap-1.5 text-hazard">
          <ArrowRight className="size-5" />
          <span className="font-mono text-[0.6rem] leading-tight tracking-[0.12em] uppercase [writing-mode:vertical-rl]">
            {hint}
          </span>
        </span>
      </div>
    </div>
  );
}
