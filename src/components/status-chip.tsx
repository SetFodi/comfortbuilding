import type { ProjectStatus } from "@/lib/types";

interface StatusChipProps {
  readonly status: ProjectStatus;
  readonly label: string;
  readonly onLight?: boolean;
}

/** Small drawing-annotation style status marker. */
export function StatusChip({ status, label, onLight = false }: StatusChipProps) {
  const border = onLight ? "border-ink/20" : "border-cream/20";
  const text = onLight ? "text-ink/80" : "text-cream/80";
  const dot =
    status === "ongoing"
      ? "bg-brass motion-safe:animate-pulse"
      : onLight
        ? "bg-ink/35"
        : "bg-cream/35";

  return (
    <span
      className={`inline-flex items-center gap-2 border ${border} ${text} px-3 py-1 font-mono text-[11px] tracking-[0.18em] uppercase`}
    >
      <span className={`size-1.5 ${dot}`} aria-hidden />
      {label}
    </span>
  );
}
