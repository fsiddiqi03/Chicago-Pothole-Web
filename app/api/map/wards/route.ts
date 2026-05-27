/**
 * GET /api/map/wards
 *
 * Returns a GeoJSON FeatureCollection of all 50 ward boundary polygons, used to
 * draw the selected-ward outline and the "spotlight" dimming mask on the map.
 */
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import type { WardFeature, WardFeatureCollection } from "@/types/map";

export const dynamic = "force-dynamic";

type WardRow = {
  id: number;
  name: string | null;
  current_alderman: string | null;
  // ::jsonb is parsed into a JS object by node-postgres, so this is ready to use.
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon | null;
};

export async function GET() {
  try {
    const rows = await query<WardRow>(
      `select
          id,
          name,
          current_alderman,
          ST_AsGeoJSON(geometry::geometry)::jsonb as geometry
        from wards
        order by id`,
    );

    const features: WardFeature[] = [];
    for (const row of rows) {
      if (!row.geometry) continue;
      features.push({
        type: "Feature",
        geometry: row.geometry,
        properties: {
          id: row.id,
          name: row.name ?? `Ward ${row.id}`,
          current_alderman: row.current_alderman,
        },
      });
    }

    const body: WardFeatureCollection = { type: "FeatureCollection", features };
    return NextResponse.json(body, {
      headers: {
        // Ward boundaries don't change between deploys, so let the browser/CDN
        // hold them for a day rather than re-shipping ~500KB on every visit.
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch (err) {
    console.error("[/api/map/wards] error:", err);
    return NextResponse.json(
      { error: "Failed to load ward data" },
      { status: 500 },
    );
  }
}
