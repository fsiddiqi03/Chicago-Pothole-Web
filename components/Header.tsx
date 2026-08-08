"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { NAV_LINKS } from "@/lib/nav";
import { MobileNav } from "@/components/MobileNav";

export function Header() {
  const [scrolled, setScrolled] = useState(false);

  // Drop a hairline once the page leaves the top so the sticky bar separates
  // from the hero. rAF keeps the scroll handler off the main path.
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      setScrolled(window.scrollY > 8);
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
    <header
      className={cn(
        "sticky top-0 z-40 bg-asphalt/90 backdrop-blur-sm transition-colors",
        scrolled ? "border-b border-curb" : "border-b border-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link
          href="/"
          className="group flex items-center gap-3 focus-visible:ring-2 focus-visible:ring-ice focus-visible:outline-none"
        >
          {/* A fragment of centre line. The dashes advance on hover. */}
          <span aria-hidden="true" className="flex items-center gap-1">
            <span className="h-[3px] w-3 bg-hazard transition-transform duration-300 group-hover:translate-x-1" />
            <span className="h-[3px] w-3 bg-hazard transition-transform duration-300 group-hover:translate-x-1 group-hover:delay-[40ms]" />
            <span className="h-[3px] w-3 bg-hazard/40 transition-transform duration-300 group-hover:translate-x-1 group-hover:delay-[80ms]" />
          </span>
          <span className="font-display text-xl leading-none tracking-tight text-paint uppercase">
            Chicago Pothole Tracker
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-mono text-[0.65rem] tracking-[0.2em] text-paint-dim uppercase transition-colors hover:text-hazard focus-visible:ring-2 focus-visible:ring-ice focus-visible:outline-none"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <MobileNav />
      </div>
    </header>
  );
}
