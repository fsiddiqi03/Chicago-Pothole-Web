/**
 * GET /api/dashboard
 *
 * Returns the data needed to render the homepage:
 *   - oldest open pothole (the hero counter)
 *   - SLA breach count
 *   - city summary stats
 *   - top 10 worst wards by median days-to-fix (last 30d)
 *   - top 10 fastest wards by median days-to-fix (last 30d)
 *
 * All data comes from pre-computed cache tables (dashboard_cache and
 * ward_daily_stats), so this is cheap to call frequently.
 */
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Force this route to be dynamic — Next would otherwise try to cache
// it at build time, which is wrong (the data refreshes every 4 hours).
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
        where key in ('oldest_open_pothole', 'latest_open_report', 'sla_breach_count', 'city_summary')`,
    );

    const cache: Record<string, { value: unknown; updated_at: string }> = {};
    for (const row of cacheRows) {
      cache[row.key] = { value: row.value, updated_at: row.updated_at };
    }

    // Use the latest date we have stats for, not current_date — the
    // refresh runs daily but Postgres's current_date can be ahead of our
    // most recent row across timezone boundaries. Pull both ends of the
    // distribution in one round trip so the leaderboard page can toggle
    // between the worst and the fastest wards without a second fetch.
    const allRanked = await query<LeaderboardRow>(
      `select wds.ward_id,
       w.current_alderman,
       wds.open_count,
       wds.median_days_to_fix,
       wds.repair_sample_n,
       (wds.repair_sample_n >= 5) as is_rankable,
       wds.pct_over_sla
      from ward_daily_stats wds
      join wards w on w.id = wds.ward_id
      where wds.date = (select max(date) from ward_daily_stats)
      order by (wds.repair_sample_n >= 5) desc,
      wds.median_days_to_fix asc nulls last`,
    );

    const fastest_leaderboard = allRanked.slice(0, 10);
    const leaderboard = allRanked.slice(-10).reverse();

    return NextResponse.json(
      {
        oldest_open_pothole: cache.oldest_open_pothole?.value ?? null,
        latest_open_report: cache.latest_open_report?.value ?? null,
        sla_breach_count: cache.sla_breach_count?.value ?? null,
        city_summary: cache.city_summary?.value ?? null,
        leaderboard,
        fastest_leaderboard,
        // The full distribution was already fetched to slice the two tails;
        // returning it costs nothing and lets the homepage plot all 50 wards.
        all_wards: allRanked,
        updated_at:
          Object.values(cache)
            .map((c) => c.updated_at)
            .sort()
            .pop() ?? null,
      },
      {
        headers: {
          // Backed by cache tables refreshed every 4 hours, so let Vercel's CDN
          // serve repeated requests from the edge and refresh in the background.
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=14400",
        },
      },
    );
  } catch (err) {
    console.error('[/api/dashboard] error:', err);
    return NextResponse.json(
      { error: 'Failed to load dashboard data' },
      { status: 500 },
    );
  }
}