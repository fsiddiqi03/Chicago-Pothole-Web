"use client";

import { Camera, ThumbsUp } from "lucide-react";

import type { PotholeFeatureProperties } from "@/types/map";
import { formatReportDate, titleCase } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface PotholeDetailPanelProps {
  pothole: PotholeFeatureProperties | null;
  alderman: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const OPEN_LIKE = new Set(["open", "dup_open"]);

function statusMeta(p: PotholeFeatureProperties): { color: string; label: string } {
  if (OPEN_LIKE.has(p.status)) {
    return {
      color: p.over_sla ? "#c8102e" : "#f59e0b",
      label: `Open · ${p.age_days.toLocaleString("en-US")} day${p.age_days === 1 ? "" : "s"}`,
    };
  }
  if (p.status === "completed" || p.status === "dup_closed") {
    return { color: "#10b981", label: "Completed" };
  }
  return { color: "#6b7280", label: "Canceled" };
}

export function PotholeDetailPanel({
  pothole,
  alderman,
  open,
  onOpenChange,
}: PotholeDetailPanelProps) {
  const meta = pothole ? statusMeta(pothole) : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full gap-0 overflow-y-auto bg-paper p-0 sm:w-[400px] sm:max-w-none"
      >
        {pothole && meta ? (
          <>
            <SheetHeader className="gap-3 px-6 pt-6 pb-0">
              <span
                className="inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold tracking-wide"
                style={{ color: meta.color, backgroundColor: `${meta.color}1a` }}
              >
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: meta.color }}
                />
                {meta.label}
              </span>
              <SheetTitle className="font-display text-3xl leading-tight tracking-tight text-ink">
                {titleCase(pothole.street_address) || "Address unavailable"}
              </SheetTitle>
              <SheetDescription className="sr-only">
                Details for pothole report {pothole.source_id}
              </SheetDescription>
            </SheetHeader>

            <div className="px-6 pt-5 pb-6">
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-neutral-500">Ward</dt>
                  <dd className="text-right text-ink">
                    Ward {pothole.ward_id}
                    {alderman ? ` · Ald. ${alderman}` : ""}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-neutral-500">Reported</dt>
                  <dd className="text-right text-ink">
                    {formatReportDate(pothole.created_at)}
                  </dd>
                </div>
                {pothole.completed_at && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-neutral-500">Closed</dt>
                    <dd className="text-right text-ink">
                      {formatReportDate(pothole.completed_at)}
                    </dd>
                  </div>
                )}
                <div className="flex justify-between gap-4">
                  <dt className="text-neutral-500">311 ticket</dt>
                  <dd className="text-right font-mono text-xs text-neutral-600">
                    {pothole.source_id}
                  </dd>
                </div>
              </dl>

              <hr className="my-6 border-neutral-300" />

              <div className="space-y-3">
                <p className="font-mono text-[0.65rem] tracking-[0.2em] text-neutral-400 uppercase">
                  Coming soon
                </p>
                <button
                  type="button"
                  disabled
                  className="flex w-full cursor-not-allowed items-center gap-2.5 rounded-md border border-neutral-300 px-4 py-3 text-left text-sm text-neutral-400"
                >
                  <ThumbsUp className="size-4 shrink-0" aria-hidden="true" />
                  Vote that this pothole still needs fixing
                </button>
                <button
                  type="button"
                  disabled
                  className="flex w-full cursor-not-allowed items-center gap-2.5 rounded-md border border-neutral-300 px-4 py-3 text-left text-sm text-neutral-400"
                >
                  <Camera className="size-4 shrink-0" aria-hidden="true" />
                  Add a photo
                </button>
              </div>

              <p className="mt-8 text-xs leading-relaxed text-neutral-400">
                Data from Chicago 311. This site is unofficial.
              </p>
            </div>
          </>
        ) : (
          <div className={cn("p-6")} />
        )}
      </SheetContent>
    </Sheet>
  );
}
