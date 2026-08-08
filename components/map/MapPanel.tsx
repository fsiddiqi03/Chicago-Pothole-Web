"use client";

import type { MapStatusFilter } from "@/types/map";
import { describeView, legendEntries } from "@/lib/map-copy";
import { MapFilters, type WardOption } from "@/components/map/MapFilters";

interface MapPanelBodyProps {
  wards: WardOption[];
  status: MapStatusFilter;
  ward: number | null;
  /** Alderman for the selected ward, when one is selected. */
  alderman: string | null;
  visibleCount: number;
  loading: boolean;
  /** The pothole fetch failed — say so instead of reporting a count of zero. */
  error: boolean;
  onStatusChange: (status: MapStatusFilter) => void;
  onWardChange: (ward: number | null) => void;
}

/**
 * What the map is showing, how to change it, and what the pin colors mean —
 * one panel instead of three corners. Rendered inside the desktop overlay card
 * and the mobile sheet, so it owns no positioning of its own.
 */
export function MapPanelBody({
  wards,
  status,
  ward,
  alderman,
  visibleCount,
  loading,
  error,
  onStatusChange,
  onWardChange,
}: MapPanelBodyProps) {
  const view = describeView(status, ward, alderman);
  const isEmpty = !loading && !error && visibleCount === 0;

  return (
    <div className="flex flex-col gap-5">
      <div>
        {/* The page's h1 carries this same text for assistive tech; this is the
            visible restatement, so it stays out of the accessibility tree. */}
        <p
          aria-hidden="true"
          className="font-display text-4xl leading-[0.95] tracking-tight text-paint uppercase"
        >
          {view.headline}
        </p>
        {view.subhead && (
          <p className="mt-1.5 font-mono text-[0.65rem] tracking-[0.16em] text-paint-dim uppercase">
            {view.subhead}
          </p>
        )}
        <p className="mt-2.5 text-sm leading-relaxed text-paint-dim">
          {view.blurb}
        </p>
        <p
          aria-live="polite"
          className="mt-4 border-t border-curb pt-3 font-mono text-xs tracking-wide text-paint-dim"
        >
          {loading ? (
            "Counting reports…"
          ) : error ? (
            <span className="text-cone">
              Couldn&apos;t load reports. Retry from the message above the map.
            </span>
          ) : isEmpty ? (
            <span className="text-cone">
              No reports match these filters. Try another ward or status.
            </span>
          ) : (
            <>
              <span className="font-semibold text-paint">
                {visibleCount.toLocaleString("en-US")}
              </span>{" "}
              visible on the map
            </>
          )}
        </p>
      </div>

      <MapFilters
        wards={wards}
        status={status}
        ward={ward}
        onStatusChange={onStatusChange}
        onWardChange={onWardChange}
      />

      <div className="border-t border-curb pt-4">
        <ul className="space-y-1.5">
          {legendEntries(status).map((entry) => (
            <li
              key={entry.label}
              className="flex items-center gap-2.5 text-xs text-paint-dim"
            >
              <span
                className="size-2.5 shrink-0 rounded-full ring-1 ring-white/10"
                style={{ backgroundColor: entry.color }}
              />
              {entry.label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
