"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { NAV_LINKS } from "@/lib/nav";
import { MobileNav } from "@/components/MobileNav";

export function Header() {
  const [scrolled, setScrolled] = useState(false);

  // Add a hairline + shadow once the page leaves the top, so the sticky
  // masthead lifts off the hero. rAF keeps the scroll handler off the main path.
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
        "sticky top-0 z-40 bg-paper/85 backdrop-blur-sm transition-shadow",
        scrolled
          ? "border-b border-neutral-300 shadow-[0_1px_0_rgba(0,0,0,0.04)]"
          : "border-b border-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link
          href="/"
          className="group flex items-center gap-2.5 rounded-sm focus-visible:ring-2 focus-visible:ring-chicago-blue focus-visible:outline-none"
        >
          <span className="size-3 bg-chicago-red transition-transform group-hover:rotate-45" />
          <span className="font-display text-lg font-semibold tracking-tight text-ink">
            Chicago Pothole Tracker
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-sm text-[0.7rem] font-medium tracking-[0.18em] text-neutral-500 uppercase transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-chicago-blue focus-visible:outline-none"
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
