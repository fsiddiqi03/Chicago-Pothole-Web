/**
 * GET /api/dashboard
 *
 * Returns the data needed to render the homepage:
 *   - oldest open pothole (the hero counter)
 *   - SLA breach count
 *   - city summary stats
 *   - top 10 worst wards by SLA breach %
 *
 * All data comes from pre-computed cache tables (dashboard_cache and
 * ward_daily_stats), so this is cheap to call frequently.
 */
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Force this route to be dynamic — Next would otherwise try to cache
// it at build time, which is wrong (the data changes daily).
export const dynamic = 'force-dynamic';

type CacheRow = {
  key: string;
  value: unknown;
  updated_at: string;
};

type LeaderboardRow = {
  ward_id: number;
  current_alderman: string | null;
  open_count: number;
  median_days_to_fix: string | null;
  pct_over_sla: string | null;
};

export async function GET() {
  try {
    const cacheRows = await query<CacheRow>(
      `select key, value, updated_at
         from dashboard_cache
        where key in ('oldest_open_pothole', 'sla_breach_count', 'city_summary')`,
    );

    const cache: Record<string, { value: unknown; updated_at: string }> = {};
    for (const row of cacheRows) {
      cache[row.key] = { value: row.value, updated_at: row.updated_at };
    }

    // Use the latest date we have stats for, not current_date — the
    // refresh runs daily but Postgres's current_date can be ahead of our
    // most recent row across timezone boundaries.
    const leaderboard = await query<LeaderboardRow>(
      `select wds.ward_id,
              w.current_alderman,
              wds.open_count,
              wds.median_days_to_fix,
              wds.pct_over_sla
         from ward_daily_stats wds
         join wards w on w.id = wds.ward_id
        where wds.date = (select max(date) from ward_daily_stats)
        order by wds.pct_over_sla desc nulls last
        limit 10`,
    );

    return NextResponse.json({
      oldest_open_pothole: cache.oldest_open_pothole?.value ?? null,
      sla_breach_count: cache.sla_breach_count?.value ?? null,
      city_summary: cache.city_summary?.value ?? null,
      leaderboard,
      updated_at:
        Object.values(cache)
          .map((c) => c.updated_at)
          .sort()
          .pop() ?? null,
    });
  } catch (err) {
    console.error('[/api/dashboard] error:', err);
    return NextResponse.json(
      { error: 'Failed to load dashboard data' },
      { status: 500 },
    );
  }
}