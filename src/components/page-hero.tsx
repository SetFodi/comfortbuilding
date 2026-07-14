import Image from "next/image";

interface PageHeroProps {
  readonly eyebrow: string;
  readonly title: string;
  readonly lede: string;
  readonly image: string;
  readonly imageAlt: string;
  readonly annotation?: string;
}

/** Editorial cover sheet for top-level routes. */
export function PageHero({
  eyebrow,
  title,
  lede,
  image,
  imageAlt,
  annotation = "COMFORT BUILDING / BATUMI",
}: PageHeroProps) {
  return (
    <section className="relative flex min-h-[72svh] items-end overflow-hidden bg-ink pt-28">
      <div className="hero-media absolute inset-0">
        <Image
          src={image}
          alt={imageAlt}
          fill
          loading="eager"
          fetchPriority="high"
          sizes="100vw"
          className="object-cover"
        />
      </div>
      <div
        className="absolute inset-0 bg-[linear-gradient(105deg,rgba(11,13,15,.92)_0%,rgba(11,13,15,.62)_48%,rgba(11,13,15,.16)_100%)]"
        aria-hidden
      />
      <div className="draft-grid absolute inset-0 opacity-40" aria-hidden />

      <div className="wrap hero-stagger relative z-10 py-16 md:py-24">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-5 max-w-5xl font-display text-[clamp(3.25rem,8vw,7.5rem)] leading-[0.95] font-medium tracking-[-0.035em] text-cream">
          {title}
        </h1>
        <div className="mt-8 grid gap-8 border-t border-cream/20 pt-6 md:grid-cols-12">
          <p className="max-w-2xl text-base leading-relaxed text-cream/80 md:col-span-7 md:text-lg">
            {lede}
          </p>
          <p className="font-mono text-[11px] leading-relaxed tracking-[0.16em] text-cream/60 uppercase md:col-span-5 md:text-right">
            {annotation}
          </p>
        </div>
      </div>
    </section>
  );
}
