interface SectionHeadingProps {
  label: string;
}

/**
 * Section marker: a hazard tick, the label, and a stripe running to the edge of
 * the column. No numerals — the sections aren't a sequence, so numbering them
 * would assert an order the content doesn't have.
 */
export function SectionHeading({ label }: SectionHeadingProps) {
  return (
    <div className="flex items-center gap-4">
      <span aria-hidden="true" className="size-2 shrink-0 bg-hazard" />
      <span className="font-mono text-[0.65rem] tracking-[0.24em] text-paint-dim uppercase">
        {label}
      </span>
      <span aria-hidden="true" className="shoulder-rule h-px flex-1" />
    </div>
  );
}
