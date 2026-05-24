interface SectionHeadingProps {
  /** Two-digit editorial numeral, e.g. "01". */
  numeral: string;
  label: string;
}

// Newspaper-style section marker: red numeral, spaced label, and a hairline
// that runs to the edge of the column.
export function SectionHeading({ numeral, label }: SectionHeadingProps) {
  return (
    <div className="flex items-center gap-4">
      <span className="font-mono text-xs font-medium text-chicago-red">
        {numeral}
      </span>
      <span className="font-mono text-xs tracking-[0.25em] text-neutral-500 uppercase">
        {label}
      </span>
      <span className="h-px flex-1 bg-neutral-300" />
    </div>
  );
}
