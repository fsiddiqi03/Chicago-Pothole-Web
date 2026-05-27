import { format } from 'date-fns';

const DASH = '—';

/** Integer with thousands separators, or an em dash for missing data. */
export function formatInt(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return DASH;
  return value.toLocaleString('en-US');
}

/** Fixed-decimal number, or an em dash for missing data. */
export function formatDecimal(
  value: number | null | undefined,
  digits = 1,
): string {
  if (value == null || Number.isNaN(value)) return DASH;
  return value.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

/** Calendar date like "January 4, 2025". */
export function formatReportDate(iso: string | null | undefined): string {
  if (!iso) return DASH;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return DASH;
  return format(d, 'MMMM d, yyyy');
}

/**
 * Refresh timestamp rendered in Central Time, e.g.
 * "May 23, 2026 at 4:22 PM CT". The stored value is UTC; we convert with
 * Intl rather than date-fns because the "CT" label must stay accurate across
 * DST and date-fns can't change time zones without an extra package.
 */
export function formatRefreshedAt(iso: string | null | undefined): string {
  if (!iso) return DASH;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return DASH;
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).formatToParts(d);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? '';
  return `${part('month')} ${part('day')}, ${part('year')} at ${part('hour')}:${part('minute')} ${part('dayPeriod')} CT`;
}

export interface Elapsed {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

/** Decompose the gap between two epoch-ms values into d/h/m/s. */
export function elapsedBetween(fromMs: number, toMs: number): Elapsed {
  const totalSeconds = Math.max(0, Math.floor((toMs - fromMs) / 1000));
  return {
    days: Math.floor(totalSeconds / 86_400),
    hours: Math.floor((totalSeconds % 86_400) / 3_600),
    minutes: Math.floor((totalSeconds % 3_600) / 60),
    seconds: totalSeconds % 60,
  };
}

export function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

/** "1000 S LAKE SHORE DR" -> "1000 S Lake Shore Dr" for display. */
export function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split(' ')
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
    .join(' ');
}

/**
 * Plain-English "time since last report" for the hero timer's aria-label.
 * Days are spoken only when present; under 24 hours the day unit is dropped.
 * Minute-granular; seconds are omitted so assistive tech isn't churning.
 */
export function describeSinceReport(e: Elapsed): string {
  const parts: string[] = [];
  if (e.days) parts.push(`${e.days} day${e.days === 1 ? '' : 's'}`);
  if (e.hours) parts.push(`${e.hours} hour${e.hours === 1 ? '' : 's'}`);
  parts.push(`${e.minutes} minute${e.minutes === 1 ? '' : 's'}`);
  return `Most recent pothole reported ${parts.join(', ')} ago`;
}
