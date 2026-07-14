import type { Dict } from "@/lib/dictionary";
import { SERVICES } from "@/lib/site";
import type { Lang, Localized } from "@/lib/types";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";

const STAGGER_STEP_MS = 110;

const SERVICES_TITLE: Localized = {
  ka: "მეტი, ვიდრე მშენებლობა",
  en: "More than construction",
  ru: "Больше, чем строительство",
};

interface ServicesSectionProps {
  readonly lang: Lang;
  readonly dict: Dict;
}

/** The three services the company offers buyers, beyond construction itself. */
export function ServicesSection({ lang, dict }: ServicesSectionProps) {
  return (
    <section className="border-t border-ink/10 bg-paper py-24 text-ink md:py-32">
      <div className="wrap">
        <SectionHeading
          eyebrow={dict.sections.services}
          title={SERVICES_TITLE[lang]}
          onLight
        />
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {SERVICES.map((service, index) => (
            <Reveal key={service.key} delayMs={index * STAGGER_STEP_MS}>
              <article className="group h-full border border-ink/15 p-8 transition-colors duration-300 hover:border-brass">
                <div className="h-px w-10 bg-brass transition-all duration-300 group-hover:w-16" />
                <h3 className="mt-6 font-display text-2xl font-medium">
                  {service.title[lang]}
                </h3>
                <p className="mt-4 text-[15px] leading-relaxed text-ink/65">
                  {service.body[lang]}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
