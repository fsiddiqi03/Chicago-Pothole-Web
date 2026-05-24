"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";

import { NAV_LINKS } from "@/lib/nav";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <button
        type="button"
        aria-label="Open navigation menu"
        onClick={() => setOpen(true)}
        className="rounded-md p-2 text-ink transition-colors hover:bg-neutral-200/60 focus-visible:ring-2 focus-visible:ring-chicago-blue focus-visible:outline-none md:hidden"
      >
        <Menu className="size-5" />
      </button>

      <SheetContent side="right" className="w-72 bg-paper">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 font-display text-base">
            <span className="size-2.5 bg-chicago-red" />
            Chicago Pothole Tracker
          </SheetTitle>
          <SheetDescription className="sr-only">
            Site navigation links
          </SheetDescription>
        </SheetHeader>
        <nav className="flex flex-col gap-1 px-3">
          {NAV_LINKS.map((link, i) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="flex items-baseline gap-3 rounded-md px-2 py-3 font-display text-2xl text-ink transition-colors hover:text-chicago-red focus-visible:ring-2 focus-visible:ring-chicago-blue focus-visible:outline-none"
            >
              <span className="font-mono text-xs text-neutral-400">
                0{i + 1}
              </span>
              {link.label}
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
