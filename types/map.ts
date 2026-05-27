// GeoJSON shapes for the /map page. Deliberately narrow — only the fields the
// Mapbox layers and the detail panel actually read.

/** The concrete status values stored in the DB's `pothole_status` enum. */
export type PotholeStatus =
  | "open"
  | "dup_open"
  | "completed"
  | "dup_closed"
  | "canceled";

/** The buckets a user can pick in the filter UI (maps to one or more statuses). */
export type MapStatusFilter = "open" | "completed" | "canceled" | "all";

export interface PotholeFeatureProperties {
  id: string;
  source_id: string;
  status: PotholeStatus;
  /** ISO 8601 timestamp. */
  created_at: string;
  /** ISO 8601 timestamp, or null while the report is still open. */
  completed_at: string | null;
  street_address: string;
  ward_id: number;
  /** Whole days since the report was created. */
  age_days: number;
  /** age_days > 7 while still open — i.e. past the city's 7-day target. */
  over_sla: boolean;
}

export interface PotholeFeature {
  type: "Feature";
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: PotholeFeatureProperties;
}

export interface PotholeFeatureCollection {
  type: "FeatureCollection";
  features: PotholeFeature[];
}

export interface WardFeatureProperties {
  id: number;
  name: string;
  current_alderman: string | null;
}

export interface WardFeature {
  type: "Feature";
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon;
  properties: WardFeatureProperties;
}

export interface WardFeatureCollection {
  type: "FeatureCollection";
  features: WardFeature[];
}
