/**
 * GET /api/map/potholes
 *
 * Returns a GeoJSON FeatureCollection of pothole points for the map.
 *
 * Query params:
 *   - status: "open" (default) | "completed" | "canceled" | "all"
 *   - ward:   1–50 (optional) — restrict to a single ward
 */
import { NextResponse, type NextRequest } from "next/server";
import { query } from "@/lib/db";
import type {
  PotholeFeature,
  PotholeFeatureCollection,
  PotholeStatus,
} from "@/types/map";

export const dynamic = "force-dynamic";

// A filter bucket expands to the concrete enum values it covers. Duplicate
// reports (`dup_open`/`dup_closed`) are the same physical pothole logged more
// than once in 311, so we never map them — every bucket, including "all", lists
// only the canonical statuses. Dropping the dups also keeps "all" near ~52k
// rows instead of ~80k.
const STATUS_GROUPS: Record<string, PotholeStatus[]> = {
  open: ["open"],
  completed: ["completed"],
  canceled: ["canceled"],
  all: ["open", "completed", "canceled"],
};

const OPEN_LIKE = new Set<PotholeStatus>(["open"]);

type PotholeRow = {
  id: string;
  source_id: string;
  status: PotholeStatus;
  // pg parses timestamptz columns into Date objects.
  created_at: Date | string;
  completed_at: Date | string | null;
  street_address: string | null;
  ward_id: number | null;
  // ST_X/ST_Y return double precision → JS number; epoch math may arrive as string.
  lng: number | null;
  lat: number | null;
  age_days: number | string | null;
};

function toIso(value: Date | string | null): string | null {
  if (value == null) return null;
  return value instanceof Date ? value.toISOString() : value;
}

// Trim coordinate precision to ~1.1m. Full float precision (15+ digits) bloats
// the payload for no visible gain — and it's already finer than the 4-decimal
// grid the locations are collapsed on.
function round5(n: number): number {
  return Math.round(n * 1e5) / 1e5;
}

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;

    const statusKey = (params.get("status") ?? "open").toLowerCase();
    const group = STATUS_GROUPS[statusKey] ?? STATUS_GROUPS.open;
    const statusList = group.join(",");

    let ward: number | null = null;
    const wardParam = params.get("ward");
    if (wardParam) {
      const n = Number(wardParam);
      if (Number.isInteger(n) && n >= 1 && n <= 50) ward = n;
    }

    // One pin per physical location. Multiple 311 tickets can sit at the same
    // address (e.g. an old completed ticket plus a fresh open one); Mapbox would
    // stack them in arbitrary z-order, so a completed pin could hide an open one
    // and falsely read as "no problem here". We rank tickets at each location by
    // status priority (open > completed > canceled), break ties by recency, and
    // keep only the winner. Coordinates are rounded to 4 decimals (~10m) so the
    // city's occasional re-geocoding drift still groups as one location.
    // Filters run inside the CTE, so e.g. ?status=open still ranks among open
    // tickets only — the collapse never reaches across buckets.
    const rows = await query<PotholeRow>(
      `with ranked as (
        select
          id,
          source_id,
          status,
          created_at,
          completed_at,
          street_address,
          ward_id,
          ST_X(location::geometry) as lng,
          ST_Y(location::geometry) as lat,
          extract(epoch from now() - created_at) / 86400 as age_days,
          row_number() over (
            partition by
              round(ST_Y(location::geometry)::numeric, 4),
              round(ST_X(location::geometry)::numeric, 4)
            order by
              case status
                when 'open' then 1
                when 'completed' then 2
                when 'canceled' then 3
                else 4
              end,
              created_at desc
          ) as rn
        from potholes
        where status = ANY(string_to_array($1, ',')::pothole_status[])
          and ($2::int is null or ward_id = $2)
      )
      select
        id,
        source_id,
        status,
        created_at,
        completed_at,
        street_address,
        ward_id,
        lng,
        lat,
        age_days
      from ranked
      where rn = 1
      -- Safety ceiling; collapsed result is well under this. If the data ever
      -- outgrows it, keep the most recent reports.
      order by created_at desc
      limit 100000`,
      [statusList, ward],
    );

    const features: PotholeFeature[] = [];
    for (const row of rows) {
      // A handful of legacy rows have no geocoded location; they can't be mapped.
      if (row.lng == null || row.lat == null) continue;
      const ageDays = Math.max(0, Math.round(Number(row.age_days ?? 0)));
      features.push({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [round5(Number(row.lng)), round5(Number(row.lat))],
        },
        properties: {
          id: row.id,
          source_id: row.source_id,
          status: row.status,
          created_at: toIso(row.created_at) ?? "",
          completed_at: toIso(row.completed_at),
          street_address: row.street_address ?? "",
          ward_id: row.ward_id ?? 0,
          age_days: ageDays,
          over_sla: ageDays > 7 && OPEN_LIKE.has(row.status),
        },
      });
    }

    const body: PotholeFeatureCollection = { type: "FeatureCollection", features };
    return NextResponse.json(body);
  } catch (err) {
    console.error("[/api/map/potholes] error:", err);
    return NextResponse.json(
      { error: "Failed to load pothole data" },
      { status: 500 },
    );
  }
}
