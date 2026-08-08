const WIDTH = 140;
const HEIGHT = 32;
const PAD = 3;

interface WardSparklineProps {
  values: (number | null)[];
  /** Stroke colour, passed as a literal so SVG can use it directly. */
  stroke: string;
}

/**
 * Trend shape only. Each row is scaled to its own range — a ward at 1 day and a
 * ward at 96 share no useful vertical scale — so height is never comparable
 * between rows. The numeric column beside it carries the magnitude, and the row
 * states the change in words.
 *
 * Deliberately plain SVG: a sparkline has no axes, no legend and no tooltip, so
 * a charting runtime per row would be cost without benefit.
 */
export function WardSparkline({ values, stroke }: WardSparklineProps) {
  const present = values.filter((v): v is number => v != null);
  if (present.length < 2) return <div className="h-8 w-[140px]" />;

  const lo = Math.min(...present);
  const hi = Math.max(...present);
  const span = hi - lo || 1;
  const stepX = (WIDTH - PAD * 2) / Math.max(1, values.length - 1);

  const x = (i: number) => PAD + i * stepX;
  const y = (v: number) =>
    HEIGHT - PAD - ((v - lo) / span) * (HEIGHT - PAD * 2);

  // A missing day breaks the trace rather than being bridged, so a gap never
  // reads as a straight run between two real readings.
  const segments: string[] = [];
  let run: string[] = [];
  values.forEach((v, i) => {
    if (v == null) {
      if (run.length > 1) segments.push(run.join(" "));
      run = [];
      return;
    }
    run.push(`${x(i).toFixed(1)},${y(v).toFixed(1)}`);
  });
  if (run.length > 1) segments.push(run.join(" "));

  const lastIndex = values.reduce<number>(
    (acc, v, i) => (v != null ? i : acc),
    -1,
  );
  const lastValue = lastIndex >= 0 ? values[lastIndex] : null;

  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      width={WIDTH}
      height={HEIGHT}
      className="overflow-visible"
    >
      {segments.map((points) => (
        <polyline
          key={points.slice(0, 24)}
          points={points}
          fill="none"
          stroke={stroke}
          strokeWidth={1.75}
          strokeLinejoin="round"
          strokeLinecap="round"
          opacity={0.85}
        />
      ))}
      {lastValue != null && (
        <circle cx={x(lastIndex)} cy={y(lastValue)} r={2.75} fill={stroke} />
      )}
    </svg>
  );
}
