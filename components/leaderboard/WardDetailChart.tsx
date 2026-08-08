"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatDecimal, formatInt } from "@/lib/format";

const SLA_DAYS = 7;

const INK = "#f4f1e8";
const INK_DIM = "#b0ada5";
const GRID = "#454b56";
const HAZARD = "#ffc72c";
const SURFACE = "#2f343c";

interface WardDetailChartProps {
  dates: string[];
  medians: (number | null)[];
  opens: (number | null)[];
}

function shortDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const AXIS = {
  stroke: GRID,
  tick: { fill: INK_DIM, fontSize: 11 },
  tickLine: false,
} as const;

function DetailTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { payload?: { median: number | null; open: number | null } }[];
  label?: string | number;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;
  if (!point) return null;
  return (
    <div className="border border-curb bg-aggregate px-3 py-2 shadow-lg">
      <p className="font-mono text-[0.65rem] tracking-[0.14em] text-paint-dim uppercase">
        {shortDate(String(label))}
      </p>
      <p className="mt-1 font-mono text-sm text-paint tabular-nums">
        {point.median == null ? "—" : formatDecimal(point.median)}{" "}
        <span className="text-paint-dim">days median</span>
      </p>
      <p className="font-mono text-xs text-paint-dim tabular-nums">
        {formatInt(point.open ?? undefined)} open
      </p>
    </div>
  );
}

/** One ward's median over the recorded window, against the city's target. */
export function WardDetailChart({
  dates,
  medians,
  opens,
}: WardDetailChartProps) {
  const data = dates.map((date, i) => ({
    date,
    median: medians[i] ?? null,
    open: opens[i] ?? null,
  }));
  const tickInterval = Math.max(1, Math.floor(data.length / 5));

  // The figures listed beside this chart carry the same values in text, so the
  // plot stays out of the accessibility tree instead of exposing axis ticks.
  return (
    <div aria-hidden="true" className="h-60 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 10, right: 12, bottom: 0, left: -18 }}
        >
          <CartesianGrid stroke={GRID} strokeOpacity={0.5} vertical={false} />
          <XAxis
            dataKey="date"
            interval={tickInterval}
            tickFormatter={shortDate}
            {...AXIS}
          />
          {/* Anchor at zero so the 7-day target is always on-plot, whether the
              ward runs at 2 days or 97. */}
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
          <Tooltip cursor={{ stroke: GRID }} content={<DetailTooltip />} />
          <Line
            type="monotone"
            dataKey="median"
            stroke={INK}
            strokeWidth={2}
            dot={false}
            connectNulls={false}
            activeDot={{ r: 4, fill: INK, stroke: SURFACE, strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
