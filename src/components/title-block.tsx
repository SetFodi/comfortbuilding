import type { CSSProperties, ReactNode } from "react";

export interface TitleBlockCell {
  readonly label: string;
  readonly value: ReactNode;
}

interface TitleBlockProps {
  readonly cells: readonly TitleBlockCell[];
  readonly onLight?: boolean;
}

/**
 * The signature device of the site: an architect's drawing title block —
 * a bordered strip of labelled cells, as found on construction documents.
 */
export function TitleBlock({ cells, onLight = false }: TitleBlockProps) {
  const border = onLight ? "border-ink/15" : "border-cream/15";
  const label = onLight ? "text-ink/50" : "text-cream/50";
  const value = onLight ? "text-ink" : "text-cream";

  return (
    <dl
      className={`grid grid-cols-2 overflow-hidden border ${border} md:[grid-template-columns:repeat(var(--tb-cols),minmax(0,1fr))]`}
      style={{ "--tb-cols": String(cells.length) } as CSSProperties}
    >
      {cells.map((cell, index) => (
        <div
          key={cell.label + index}
          className={`-mt-px -ml-px border-t border-l ${border} p-4 md:p-5`}
        >
          <dt
            className={`font-mono text-[10px] uppercase tracking-[0.24em] ${label}`}
          >
            {cell.label}
          </dt>
          <dd className={`mt-2 text-sm font-medium md:text-[15px] ${value}`}>
            {cell.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
