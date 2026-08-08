import { query } from "@/lib/db";

/**
 * Daily history out of `ward_daily_stats`. Series are returned column-wise
 * against one shared list of dates: the leaderboard renders twenty wards at
 * once, and repeating the date strings per ward would dominate the payload.
 */
export interface WardHistoryBundle {
  /** ISO dates, ascending. Every series is aligned to this. */
  dates: string[];
  /** Keyed by ward id. */
  series: Record<
    number,
    {
      /** Median days to fix; null on days the ward closed nothing. */
      medians: (number | null)[];
      /** Open reports carried that day. */
      opens: (number | null)[];
    }
  >;
}

export interface CityHistoryPoint {
  date: string;
  /** Median of the wards' medians — the typical ward that day. */
  wardMedian: number | null;
  /** Open reports across every ward. */
  totalOpen: number;
}

type HistoryRow = {
  ward_id: number;
  date: Date;
  open_count: number | null;
  median_days_to_fix: string | null;
};

/** pg hands back numerics as strings; coerce to a finite number or null. */
function toNumber(value: string | number | null): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function isoDate(value: Date | string): string {
  return typeof value === "string"
    ? value.slice(0, 10)
    : value.toISOString().slice(0, 10);
}

/** Daily series for the given wards, aligned to a shared date axis. */
export async function getWardHistories(
  wardIds: number[],
): Promise<WardHistoryBundle> {
  const ids = [...new Set(wardIds)].filter((id) => Number.isInteger(id));
  if (ids.length === 0) return { dates: [], series: {} };

  const rows = await query<HistoryRow>(
    `select ward_id, date, open_count, median_days_to_fix
       from ward_daily_stats
      where ward_id = any($1::int[])
      order by date asc`,
    [ids],
  );

  const dates = [...new Set(rows.map((r) => isoDate(r.date)))].sort();
  const indexOf = new Map(dates.map((d, i) => [d, i]));

  const series: WardHistoryBundle["series"] = {};
  for (const id of ids) {
    series[id] = {
      medians: Array(dates.length).fill(null),
      opens: Array(dates.length).fill(null),
    };
  }

  // Index by date rather than assuming every ward reported every day — a gap
  // must land as a null in the right slot, not shift the whole series.
  for (const row of rows) {
    const slot = indexOf.get(isoDate(row.date));
    const target = series[row.ward_id];
    if (slot == null || !target) continue;
    target.medians[slot] = toNumber(row.median_days_to_fix);
    target.opens[slot] = toNumber(row.open_count);
  }

  return { dates, series };
}

/** One city-wide series: the typical ward's median, and the total open count. */
export async function getCityHistory(): Promise<CityHistoryPoint[]> {
  const rows = await query<{
    date: Date;
    ward_median: string | null;
    total_open: string | null;
  }>(
    `select date,
            percentile_cont(0.5) within group (order by median_days_to_fix)
              filter (where median_days_to_fix is not null) as ward_median,
            sum(open_count) as total_open
       from ward_daily_stats
      group by date
      order by date asc`,
  );

  return rows.map((r) => ({
    date: isoDate(r.date),
    wardMedian: toNumber(r.ward_median),
    totalOpen: toNumber(r.total_open) ?? 0,
  }));
}
