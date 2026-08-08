"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { CityHistoryPoint } from "@/lib/ward-history";
import { formatDecimal, formatInt } from "@/lib/format";

const SLA_DAYS = 7;

// Road tokens, repeated here because Recharts needs literal colors rather than
// Tailwind classes. Kept in sync with @theme in globals.css.
const INK = "#f4f1e8";
const INK_DIM = "#b0ada5";
const GRID = "#454b56";
const HAZARD = "#ffc72c";
const SURFACE = "#2f343c";

interface CityTrendChartProps {
  points: CityHistoryPoint[];
}

/** "2026-08-08" → "Aug 8", for axis ticks and tooltips. */
function shortDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const AXIS = {
  stroke: GRID,
  tick: { fill: INK_DIM, fontSize: 11 },
  tickLine: false,
} as const;

function TooltipCard({
  active,
  payload,
  label,
  unit,
  digits,
}: {
  active?: boolean;
  payload?: { value?: number | string }[];
  label?: string | number;
  unit: string;
  digits: number;
}) {
  if (!active || !payload?.length) return null;
  const raw = payload[0]?.value;
  const value = typeof raw === "number" ? raw : Number(raw);
  return (
    <div className="border border-curb bg-aggregate px-3 py-2 shadow-lg">
      <p className="font-mono text-[0.65rem] tracking-[0.14em] text-paint-dim uppercase">
        {shortDate(String(label))}
      </p>
      <p className="mt-1 font-mono text-sm text-paint tabular-nums">
        {digits > 0 ? formatDecimal(value, digits) : formatInt(value)}{" "}
        <span className="text-paint-dim">{unit}</span>
      </p>
    </div>
  );
}

/**
 * Two charts rather than one with two scales: days-to-fix and the size of the
 * backlog are different measures, and overlaying them on twin axes would invite
 * a comparison neither supports.
 */
export function CityTrendChart({ points }: CityTrendChartProps) {
  if (points.length === 0) return null;

  const first = points[0];
  const last = points[points.length - 1];
  // Daily data over ~11 weeks: label every other week so ticks don't collide.
  const tickInterval = Math.max(1, Math.floor(points.length / 6));

  return (
    <div className="grid grid-cols-1 gap-x-12 gap-y-12 lg:grid-cols-2">
      <figure>
        <figcaption className="mb-1 font-mono text-[0.65rem] tracking-[0.2em] text-hazard uppercase">
          Typical ward, median days to fix
        </figcaption>
        <p className="mb-5 max-w-md text-sm leading-relaxed text-paint-dim">
          The middle ward&apos;s median, day by day. It has moved from{" "}
          <span className="text-paint">
            {formatDecimal(first.wardMedian)} days
          </span>{" "}
          to{" "}
          <span className="text-paint">
            {formatDecimal(last.wardMedian)} days
          </span>{" "}
          since {shortDate(first.date)}.
        </p>
        {/* The caption above states the first and last values, so the plot
            itself stays out of the accessibility tree rather than exposing a
            run of axis ticks as text. */}
        <div aria-hidden="true" className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={points}
              margin={{ top: 8, right: 12, bottom: 0, left: -18 }}
            >
              <CartesianGrid stroke={GRID} strokeOpacity={0.5} vertical={false} />
              <XAxis
                dataKey="date"
                interval={tickInterval}
                tickFormatter={shortDate}
                {...AXIS}
              />
              {/* Anchor at zero: the target sits below every observed value, so
                  an auto domain would put the reference line off-plot. */}
              <YAxis width={54} unit="d" domain={[0, "auto"]} {...AXIS} />
              <ReferenceLine
                y={SLA_DAYS}
                stroke={HAZARD}
                strokeDasharray="6 5"
                label={{
                  value: `${SLA_DAYS}-day target`,
                  position: "insideTopLeft",
                  fill: HAZARD,
                  fontSize: 11,
                }}
              />
              <Tooltip
                cursor={{ stroke: GRID }}
                content={<TooltipCard unit="days" digits={1} />}
              />
              <Line
                type="monotone"
                dataKey="wardMedian"
                stroke={INK}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: INK, stroke: SURFACE, strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </figure>

      <figure>
        <figcaption className="mb-1 font-mono text-[0.65rem] tracking-[0.2em] text-hazard uppercase">
          Open reports citywide
        </figcaption>
        <p className="mb-5 max-w-md text-sm leading-relaxed text-paint-dim">
          The backlog itself, every ward combined. It has gone from{" "}
          <span className="text-paint">{formatInt(first.totalOpen)}</span> to{" "}
          <span className="text-paint">{formatInt(last.totalOpen)}</span> over
          the same stretch.
        </p>
        <div aria-hidden="true" className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={points}
              margin={{ top: 8, right: 12, bottom: 0, left: -6 }}
            >
              <defs>
                <linearGradient id="backlogFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={INK} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={INK} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={GRID} strokeOpacity={0.5} vertical={false} />
              <XAxis
                dataKey="date"
                interval={tickInterval}
                tickFormatter={shortDate}
                {...AXIS}
              />
              <YAxis
                width={54}
                tickFormatter={(v: number) => formatInt(v)}
                {...AXIS}
              />
              <Tooltip
                cursor={{ stroke: GRID }}
                content={<TooltipCard unit="open" digits={0} />}
              />
              <Area
                type="monotone"
                dataKey="totalOpen"
                stroke={INK}
                strokeWidth={2}
                fill="url(#backlogFill)"
                activeDot={{ r: 4, fill: INK, stroke: SURFACE, strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </figure>
    </div>
  );
}
