import Link from "next/link";
import { Fragment, type CSSProperties } from "react";
import type { Dict } from "@/lib/dictionary";
import { CONTACT } from "@/lib/site";
import { projectFloors } from "@/lib/projects";
import type { Lang, Project } from "@/lib/types";
import {
  HeroProjectCarousel,
  type HeroProjectItem,
} from "./hero-project-carousel";
import { MagneticCta } from "./magnetic-cta";
import { ProjectMarquee } from "./project-marquee";

const WORD_STAGGER_S = 0.09;

interface HeroProps {
  readonly lang: Lang;
  readonly dict: Dict;
  readonly projects: readonly Project[];
}

interface MaskedWordsProps {
  readonly text: string;
  readonly className: string;
  readonly baseDelayS: number;
}

/** Splits text into words that rise out of an overflow mask, one by one. */
function MaskedWords({ text, className, baseDelayS }: MaskedWordsProps) {
  return (
    <span className={`inline-flex flex-wrap gap-x-[0.28em] ${className}`}>
      {text.split(" ").map((word, index) => (
        <Fragment key={word + index}>
          {index > 0 ? " " : null}
          <span className="word-mask">
            <span
              style={
                {
                  "--word-delay": `${baseDelayS + index * WORD_STAGGER_S}s`,
                } as CSSProperties
              }
            >
              {word}
            </span>
          </span>
        </Fragment>
      ))}
    </span>
  );
}

export function Hero({ lang, dict, projects }: HeroProps) {
  const projectItems: readonly HeroProjectItem[] = projects.map((project) => {
    const image = project.listingImage ?? project.cover;

    return {
      slug: project.slug,
      href: `/${lang}/projects/${project.slug}`,
      name: project.name[lang],
      city: project.city[lang],
      address: project.address[lang],
      status: dict.status[project.status],
      floors: projectFloors(project, dict.misc.tba),
      image: {
        src: image.src,
        alt: image.alt[lang],
      },
    };
  });

  return (
    <section className="draft-grid relative overflow-hidden bg-ink">
      <div className="wrap grid min-h-svh grid-cols-1 items-center gap-14 pt-32 pb-16 lg:grid-cols-12 lg:gap-8 lg:pt-36 lg:pb-12">
        <div className="lg:col-span-7 lg:pr-10">
          <div
            className="hero-fade flex items-center gap-4"
            style={{ "--fade-delay": "0.55s" } as CSSProperties}
          >
            <span aria-hidden className="h-px w-12 bg-brass" />
            <span className="eyebrow">{dict.hero.eyebrow}</span>
          </div>

          <h1 className="mt-8 flex flex-col">
            <MaskedWords
              text={dict.hero.titleA}
              baseDelayS={0.15}
              className="font-sans text-[clamp(2.7rem,8.5vw,5.6rem)] leading-[1] font-semibold tracking-tight text-cream/95"
            />
            {" "}
            <MaskedWords
              text={dict.hero.titleB}
              baseDelayS={0.42}
              className="mt-2 font-display text-[clamp(2.9rem,9.5vw,6.4rem)] leading-[1.04] font-medium text-brass lg:ml-12"
            />
          </h1>

          <p
            className="hero-fade mt-10 max-w-md text-base leading-relaxed text-cream/70 md:text-lg"
            style={{ "--fade-delay": "0.95s" } as CSSProperties}
          >
            {dict.hero.lede}
          </p>

          <div
            className="hero-fade mt-9 flex flex-wrap items-center gap-4"
            style={{ "--fade-delay": "1.1s" } as CSSProperties}
          >
            <Link
              href={`/${lang}/apartments`}
              className="inline-flex min-h-12 items-center rounded-full bg-brass px-7 text-sm font-semibold tracking-wide text-ink transition-colors hover:bg-brass-bright"
            >
              {dict.cta.availableApartments}
            </Link>
            <a
              href={CONTACT.phoneHref}
              className="inline-flex min-h-12 items-center gap-3 rounded-full border border-cream/25 px-7 text-sm font-medium tracking-wide text-cream transition-colors hover:border-brass hover:text-brass"
            >
              {dict.cta.call}
              <span className="font-mono text-xs text-cream/60">
                {CONTACT.phoneDisplay}
              </span>
            </a>
          </div>
        </div>

        <div className="relative lg:col-span-5">
          <HeroProjectCarousel
            projects={projectItems}
            labels={{
              projects: dict.nav.projects,
              previous: dict.misc.previous,
              next: dict.misc.next,
            }}
          />

          <div
            className="hero-fade absolute bottom-36 -left-3 lg:-left-12"
            style={{ "--fade-delay": "1.2s" } as CSSProperties}
          >
            <MagneticCta
              href={`/${lang}/projects`}
              label={dict.nav.projects}
            />
          </div>
        </div>
      </div>

      <ProjectMarquee
        projects={projectItems}
        labels={{
          region: dict.sections.projects,
          project: dict.titleBlock.project,
          location: dict.titleBlock.location,
          status: dict.titleBlock.status,
          floors: dict.titleBlock.floors,
        }}
      />
    </section>
  );
}
