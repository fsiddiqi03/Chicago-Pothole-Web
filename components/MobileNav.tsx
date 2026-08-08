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
        className="p-2 text-paint transition-colors hover:text-hazard focus-visible:ring-2 focus-visible:ring-ice focus-visible:outline-none md:hidden"
      >
        <Menu className="size-5" />
      </button>

      <SheetContent side="right" className="w-72 border-l border-curb bg-aggregate">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2.5 font-mono text-[0.65rem] tracking-[0.2em] text-paint-dim uppercase">
            <span aria-hidden="true" className="h-[3px] w-4 bg-hazard" />
            Navigate
          </SheetTitle>
          <SheetDescription className="sr-only">
            Site navigation links
          </SheetDescription>
        </SheetHeader>
        <nav className="flex flex-col px-4">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="border-b border-curb py-4 font-display text-3xl leading-none tracking-tight text-paint uppercase transition-colors hover:text-hazard focus-visible:ring-2 focus-visible:ring-ice focus-visible:outline-none"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
