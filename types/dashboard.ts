// Shape of GET /api/dashboard. Any field can be null when the daily stats
// refresh hasn't populated its cache row yet, so consumers must null-check.

export interface OldestOpenPothole {
  id: string;
  source_id: string;
  /** ISO 8601 timestamp, e.g. "2025-01-04T08:53:11+00:00". */
  created_at: string;
  street_address: string;
  ward_id: number;
  lat: number;
  lng: number;
}

export interface SlaBreachCount {
  count: number;
  sla_days: number;
}

export interface CitySummary {
  total_open: number;
  completed_30d: number;
  avg_days_to_fix_30d: number;
  closed_no_pothole_30d: number;
}

// Numeric columns arrive as strings from pg (numeric/decimal types).
export interface LeaderboardEntry {
  ward_id: number;
  current_alderman: string | null;
  open_count: number;
  median_days_to_fix: string | null;
  pct_over_sla: string | null;
}

export interface DashboardData {
  oldest_open_pothole: OldestOpenPothole | null;
  sla_breach_count: SlaBreachCount | null;
  city_summary: CitySummary | null;
  leaderboard: LeaderboardEntry[];
  /** ISO 8601 timestamp of the most recent cache refresh. */
  updated_at: string | null;
}
