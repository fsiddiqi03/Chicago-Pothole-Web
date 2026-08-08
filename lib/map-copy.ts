// Everything on the /map overlay that is derived from the active filters —
// headline, blurb, legend, and the collapsed dateline. Keeping it here means
// the panel holds no static strings that can drift out of sync with the map.

import type { MapStatusFilter } from "@/types/map";

/** Status hues, shared by the Mapbox paint expressions and the legend. */
export const STATUS_COLORS = {
  /** Open past the city's 7-day target. */
  overdue: "#c8102e",
  /** Open, still within target. */
  open: "#f59e0b",
  completed: "#10b981",
  canceled: "#9ca3af",
} as const;

interface StatusCopy {
  /** Mono kicker above the headline; rendered uppercase by CSS. */
  kicker: string;
  /** Single word for the collapsed dateline. */
  short: string;
  blurb: string;
}

const STATUS_COPY: Record<MapStatusFilter, StatusCopy> = {
  open: {
    kicker: "Open reports",
    short: "Open",
    blurb: "Every report still waiting on a crew. Click a pin for details.",
  },
  completed: {
    kicker: "Completed repairs",
    short: "Completed",
    blurb:
      "Repairs the city has closed out. Click a pin to see how long it took.",
  },
  canceled: {
    kicker: "Canceled reports",
    short: "Canceled",
    blurb: "Reports the city closed without a repair. Click a pin for details.",
  },
  all: {
    kicker: "Every report",
    short: "All",
    blurb:
      "Every pothole report in the 311 system, whatever its status. Click a pin for details.",
  },
};

export interface ViewDescription {
  kicker: string;
  headline: string;
  /** Alderman line, only when a single ward is selected. */
  subhead: string | null;
  blurb: string;
  /** Place and status, e.g. "Ward 32 · Open". The count is appended by the caller. */
  dateline: string;
}

/** Describe what the map is currently showing. */
export function describeView(
  status: MapStatusFilter,
  ward: number | null,
  alderman: string | null,
): ViewDescription {
  const copy = STATUS_COPY[status];
  const place = ward == null ? "Chicago" : `Ward ${ward}`;

  return {
    kicker: copy.kicker,
    headline: place,
    subhead: ward != null && alderman ? `Ald. ${alderman}` : null,
    blurb: copy.blurb,
    dateline: `${place} · ${copy.short}`,
  };
}

export interface LegendEntry {
  color: string;
  label: string;
}

/** Only the pin colors the current status filter can actually produce. */
export function legendEntries(status: MapStatusFilter): LegendEntry[] {
  const overdue = { color: STATUS_COLORS.overdue, label: "Past 7-day target" };
  const open = { color: STATUS_COLORS.open, label: "Open, within 7 days" };
  const completed = { color: STATUS_COLORS.completed, label: "Completed" };
  const canceled = { color: STATUS_COLORS.canceled, label: "Canceled" };

  switch (status) {
    case "open":
      return [overdue, open];
    case "completed":
      return [completed];
    case "canceled":
      return [canceled];
    default:
      return [overdue, open, completed, canceled];
  }
}
