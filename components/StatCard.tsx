import { AlertTriangle } from "lucide-react";

import { cn } from "@/lib/utils";

interface StatCardProps {
  /** Pre-formatted display value (e.g. "2,370" or "—"). */
  value: string;
  label: string;
  /** "red" marks an accountability stat: red number + warning icon so the
   *  signal doesn't rely on color alone. */
  accent?: "red" | "neutral";
}

export function StatCard({ value, label, accent = "neutral" }: StatCardProps) {
  const isAlert = accent === "red";
  return (
    <div className="group flex flex-col gap-3 border-t border-neutral-300 pt-5">
      <span
        className={cn(
          "font-mono text-5xl font-semibold tracking-tighter tabular-nums sm:text-6xl",
          isAlert ? "text-chicago-red" : "text-ink",
        )}
      >
        {value}
      </span>
      <span className="flex items-start gap-1.5 text-xs leading-relaxed tracking-wide text-neutral-500 uppercase">
        {isAlert && (
          <AlertTriangle
            className="mt-px size-3.5 shrink-0 text-chicago-red"
            aria-hidden="true"
          />
        )}
        {label}
      </span>
    </div>
  );
}
