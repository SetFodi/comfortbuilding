import Image from "next/image";
import Link from "next/link";
import type { Dict } from "@/lib/dictionary";
import { COMPANY_STORY } from "@/lib/site";
import type { Lang, Localized } from "@/lib/types";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";

/** Distilled from the company's own "calling card" sentence on its About page. */
const TEASER_TITLE: Localized = {
  ka: "ხარისხი, გუნდი და პროცესის ეფექტური მართვა",
  en: "Quality, a strong team, and effective management",
  ru: "Качество, команда и эффективное управление",
};

const PHOTO_CAPTION: Localized = {
  ka: "გრანდ ჰაუსი თბილისი · მშენებლობის პროცესი",
  en: "Grand House Tbilisi · construction in progress",
  ru: "Гранд Хаус Тбилиси · процесс строительства",
};

interface AboutTeaserProps {
  readonly lang: Lang;
  readonly dict: Dict;
}

export function AboutTeaser({ lang, dict }: AboutTeaserProps) {
  return (
    <section className="bg-limestone py-24 text-ink md:py-32">
      <div className="wrap grid items-center gap-14 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <SectionHeading
            eyebrow={dict.sections.about}
            title={TEASER_TITLE[lang]}
            onLight
          />
          <Reveal delayMs={120}>
            <p className="mt-7 max-w-xl leading-relaxed text-ink/70">
              {COMPANY_STORY[lang][0]}
            </p>
            <p className="mt-4 max-w-xl leading-relaxed text-ink/70">
              {COMPANY_STORY[lang][3]}
            </p>
            <Link
              href={`/${lang}/about`}
              className="link-slide mt-8 inline-flex items-center gap-2 text-sm font-semibold tracking-wide text-ink"
            >
              {dict.cta.aboutUs} <span aria-hidden>→</span>
            </Link>
          </Reveal>
        </div>

        <Reveal className="lg:col-span-6" delayMs={150}>
          <figure className="relative">
            <div
              aria-hidden
              className="absolute -top-4 -right-4 h-full w-full border border-brass"
            />
            <div className="relative aspect-square overflow-hidden">
              <Image
                src="/images/projects/grand-house/construction.jpg"
                alt={PHOTO_CAPTION[lang]}
                fill
                sizes="(min-width: 1024px) 45vw, 100vw"
                className="object-cover"
              />
            </div>
            <figcaption className="mt-3 font-mono text-[11px] tracking-[0.14em] text-ink/65 uppercase">
              {PHOTO_CAPTION[lang]}
            </figcaption>
          </figure>
        </Reveal>
      </div>
    </section>
  );
}
