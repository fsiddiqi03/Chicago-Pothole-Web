"use client";

import { Camera, ThumbsUp } from "lucide-react";

import type { PotholeFeatureProperties } from "@/types/map";
import { formatReportDate, titleCase } from "@/lib/format";
import { STATUS_COLORS } from "@/lib/map-copy";
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
      color: p.over_sla ? STATUS_COLORS.overdue : STATUS_COLORS.open,
      label: `Open · ${p.age_days.toLocaleString("en-US")} day${p.age_days === 1 ? "" : "s"}`,
    };
  }
  if (p.status === "completed" || p.status === "dup_closed") {
    return { color: STATUS_COLORS.completed, label: "Completed" };
  }
  return { color: STATUS_COLORS.canceled, label: "Canceled" };
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
        className="w-full gap-0 overflow-y-auto bg-asphalt p-0 sm:w-[400px] sm:max-w-none"
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
              <SheetTitle className="font-display text-4xl leading-[0.95] tracking-tight text-paint uppercase">
                {titleCase(pothole.street_address) || "Address unavailable"}
              </SheetTitle>
              <SheetDescription className="sr-only">
                Details for pothole report {pothole.source_id}
              </SheetDescription>
            </SheetHeader>

            <div className="px-6 pt-5 pb-6">
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-paint-dim">Ward</dt>
                  <dd className="text-right text-paint">
                    Ward {pothole.ward_id}
                    {alderman ? ` · Ald. ${alderman}` : ""}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-paint-dim">Reported</dt>
                  <dd className="text-right text-paint">
                    {formatReportDate(pothole.created_at)}
                  </dd>
                </div>
                {pothole.completed_at && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-paint-dim">Closed</dt>
                    <dd className="text-right text-paint">
                      {formatReportDate(pothole.completed_at)}
                    </dd>
                  </div>
                )}
                <div className="flex justify-between gap-4">
                  <dt className="text-paint-dim">311 ticket</dt>
                  <dd className="text-right font-mono text-xs text-paint-dim">
                    {pothole.source_id}
                  </dd>
                </div>
              </dl>

              <hr className="my-6 border-curb" />

              <div className="space-y-3">
                <p className="font-mono text-[0.65rem] tracking-[0.2em] text-paint-dim/70 uppercase">
                  Coming soon
                </p>
                <button
                  type="button"
                  disabled
                  className="flex w-full cursor-not-allowed items-center gap-2.5 rounded-md border border-curb px-4 py-3 text-left text-sm text-paint-dim/70"
                >
                  <ThumbsUp className="size-4 shrink-0" aria-hidden="true" />
                  Vote that this pothole still needs fixing
                </button>
                <button
                  type="button"
                  disabled
                  className="flex w-full cursor-not-allowed items-center gap-2.5 rounded-md border border-curb px-4 py-3 text-left text-sm text-paint-dim/70"
                >
                  <Camera className="size-4 shrink-0" aria-hidden="true" />
                  Add a photo
                </button>
              </div>

              <p className="mt-8 text-xs leading-relaxed text-paint-dim/70">
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
