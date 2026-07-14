import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ContactBand } from "@/components/contact-band";
import { JsonLd } from "@/components/json-ld";
import { PageHero } from "@/components/page-hero";
import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/section-heading";
import { ServicesSection } from "@/components/services-section";
import { StatBand } from "@/components/stat-band";
import { getDict } from "@/lib/dictionary";
import { ADVANTAGES, COMPANY_NAME, COMPANY_STORY } from "@/lib/site";
import {
  breadcrumbJsonLd,
  jsonLdGraph,
  pageMetadata,
  pagePath,
  webPageJsonLd,
} from "@/lib/seo";
import { isLang, type Lang, type Localized } from "@/lib/types";

const TITLE: Localized = {
  ka: "კომპანია, რომელსაც ენდობიან",
  en: "A builder people trust",
  ru: "Компания, которой доверяют",
};

const LEDE: Localized = {
  ka: "ხარისხი, პროფესიონალი გუნდი, სწორი სტრატეგია და მშენებლობის პროცესის ეფექტური მართვა — კომპანიის საკუთარი სიტყვებით, ეს მისი სავიზიტო ბარათია.",
  en: "Quality, a professional team, a sound strategy, and effective management of the construction process — in the company’s own words, these are its calling card.",
  ru: "Качество, профессиональная команда, верная стратегия и эффективное управление строительством — по словам самой компании, это её визитная карточка.",
};

const STORY_TITLE: Localized = {
  ka: "კომფორტი საქმის ნებისმიერ პროცესში",
  en: "Comfort at every stage of the process",
  ru: "Комфорт на каждом этапе процесса",
};

const ADVANTAGE_TITLE: Localized = {
  ka: "პასუხისმგებლობა, რომელიც შენობაში ჩანს",
  en: "Responsibility made visible in every building",
  ru: "Ответственность, которую видно в каждом здании",
};

const HERO_ALT: Localized = {
  ka: "გრანდ ჰაუსი თბილისში — მშენებლობის პროცესი",
  en: "Grand House Tbilisi during construction",
  ru: "Гранд Хаус Тбилиси в процессе строительства",
};

const HERO_IMAGE = {
  src: "/images/projects/grand-house/construction.jpg",
  width: 2060,
  height: 1977,
  alt: HERO_ALT,
} as const;

const META_TITLE: Localized = {
  ka: "ჩვენ შესახებ — სამშენებლო კომპანია ბათუმში",
  en: "About our construction company in Batumi",
  ru: "О строительной компании в Батуми",
};

interface AboutPageProps {
  readonly params: Promise<{ lang: string }>;
}

async function resolveLang(params: AboutPageProps["params"]): Promise<Lang> {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return lang;
}

export async function generateMetadata({
  params,
}: AboutPageProps): Promise<Metadata> {
  const lang = await resolveLang(params);
  return pageMetadata({
    lang,
    title: META_TITLE[lang],
    description: LEDE[lang],
    suffix: "/about",
    image: HERO_IMAGE,
  });
}

export default async function AboutPage({ params }: AboutPageProps) {
  const lang = await resolveLang(params);
  const dict = getDict(lang);

  return (
    <>
      <JsonLd
        data={jsonLdGraph([
          webPageJsonLd(
            lang,
            "/about",
            META_TITLE[lang],
            LEDE[lang],
            "AboutPage",
          ),
          breadcrumbJsonLd([
            { name: dict.nav.home, path: pagePath(lang) },
            { name: dict.nav.about, path: pagePath(lang, "/about") },
          ]),
        ])}
      />
      <PageHero
        eyebrow={dict.nav.about}
        title={TITLE[lang]}
        lede={LEDE[lang]}
        image={HERO_IMAGE.src}
        imageAlt={HERO_ALT[lang]}
        annotation="COMPANY PROFILE / BATUMI / GEORGIA"
      />

      <section className="draft-grid-light bg-limestone py-24 text-ink md:py-32">
        <div className="wrap grid gap-14 lg:grid-cols-12 lg:gap-20">
          <Reveal className="lg:col-span-5">
            <p className="eyebrow eyebrow-on-light">{COMPANY_NAME[lang]}</p>
            <h2 className="mt-5 max-w-xl font-display text-4xl leading-tight font-medium md:text-6xl">
              {STORY_TITLE[lang]}
            </h2>
          </Reveal>
          <div className="space-y-8 lg:col-span-7">
            {COMPANY_STORY[lang].map((paragraph, index) => (
              <Reveal key={paragraph} delayMs={index * 80}>
                <p className="border-t border-ink/15 pt-6 text-[1.02rem] leading-[1.85] text-ink/75">
                  {paragraph}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <StatBand lang={lang} />

      <section className="bg-paper py-24 text-ink md:py-32">
        <div className="wrap">
          <SectionHeading
            eyebrow={dict.sections.advantages}
            title={ADVANTAGE_TITLE[lang]}
            onLight
          />

          <div className="mt-14 grid gap-12 lg:grid-cols-12 lg:items-start">
            <Reveal className="lg:sticky lg:top-28 lg:col-span-5">
              <figure>
                <div className="relative aspect-[4/5] overflow-hidden">
                  <Image
                    src={HERO_IMAGE.src}
                    alt={HERO_ALT[lang]}
                    fill
                    sizes="(min-width: 1024px) 40vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <figcaption className="mt-3 font-mono text-[11px] tracking-[0.12em] text-ink/65 uppercase">
                  {HERO_ALT[lang]}
                </figcaption>
              </figure>
            </Reveal>

            <ol className="border-t border-ink/15 lg:col-span-7">
              {ADVANTAGES[lang].map((advantage, index) => (
                <li
                  key={advantage}
                  className="grid gap-5 border-b border-ink/15 py-8 sm:grid-cols-[5rem_1fr] md:py-10"
                >
                  <span className="font-mono text-3xl text-bronze">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <p className="text-[1.02rem] leading-[1.8] text-ink/75">
                    {advantage}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <ServicesSection lang={lang} dict={dict} />
      <ContactBand lang={lang} dict={dict} />
    </>
  );
}
