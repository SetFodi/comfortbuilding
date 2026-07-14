import { Reveal } from "./reveal";

interface SectionHeadingProps {
  readonly eyebrow: string;
  readonly title: string;
  readonly lede?: string;
  readonly onLight?: boolean;
}

export function SectionHeading({
  eyebrow,
  title,
  lede,
  onLight = false,
}: SectionHeadingProps) {
  return (
    <Reveal>
      <p className={`eyebrow ${onLight ? "eyebrow-on-light" : ""}`}>
        {eyebrow}
      </p>
      <h2
        className={`mt-4 max-w-3xl font-display text-3xl leading-tight font-medium md:text-5xl ${
          onLight ? "text-ink" : "text-cream"
        }`}
      >
        {title}
      </h2>
      {lede ? (
        <p
          className={`mt-5 max-w-xl leading-relaxed ${
            onLight ? "text-ink/65" : "text-cream/70"
          }`}
        >
          {lede}
        </p>
      ) : null}
    </Reveal>
  );
}
