import { cn } from "@/lib/utils";

interface GuideSignProps {
  /** The street, set large — the sign's reason for existing. */
  primary: string;
  /** Small line beneath, e.g. the ward. */
  secondary?: string | null;
  /** Right-hand panel, the way a guide sign carries a distance. */
  measure?: string | null;
  measureLabel?: string | null;
  className?: string;
}

/**
 * A highway guide sign: green field, white retroreflective border, white
 * legend. Chicago's street-name and destination signs use this pattern, so an
 * address on the page can be presented the way it is presented on the street.
 */
export function GuideSign({
  primary,
  secondary,
  measure,
  measureLabel,
  className,
}: GuideSignProps) {
  return (
    <div
      className={cn(
        "inline-block rounded-[1.25rem] bg-guide p-2 shadow-[0_10px_28px_rgb(0_0_0/35%)]",
        className,
      )}
    >
      {/* The inset white keyline is the sign's border, not a decorative frame. */}
      <div className="rounded-[0.75rem] border-[3px] border-paint/95 px-6 py-5 sm:px-8 sm:py-6">
        <div className="flex flex-wrap items-baseline justify-between gap-x-10 gap-y-3">
          <span className="font-display text-[clamp(2rem,5vw,3.75rem)] leading-[0.9] tracking-tight text-paint uppercase">
            {primary}
          </span>
          {measure && (
            <span className="flex items-baseline gap-2">
              <span className="font-display text-[clamp(2rem,5vw,3.75rem)] leading-[0.9] tracking-tight text-paint tabular-nums">
                {measure}
              </span>
              {measureLabel && (
                <span className="font-display text-[clamp(1rem,2vw,1.5rem)] leading-none tracking-tight text-paint/90 uppercase">
                  {measureLabel}
                </span>
              )}
            </span>
          )}
        </div>
        {secondary && (
          <span className="mt-3 block font-mono text-[0.65rem] tracking-[0.2em] text-paint/85 uppercase">
            {secondary}
          </span>
        )}
      </div>
    </div>
  );
}
