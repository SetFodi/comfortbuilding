import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContactBand } from "@/components/contact-band";
import { JsonLd } from "@/components/json-ld";
import { PageHero } from "@/components/page-hero";
import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/section-heading";
import { ServicesSection } from "@/components/services-section";
import { StatBand } from "@/components/stat-band";
import { getDict } from "@/lib/dictionary";
import { ADVANTAGES, COMPANY_NAME, COMPANY_STORY, CONTACT } from "@/lib/site";
import { PROJECTS } from "@/lib/projects";
import {
  breadcrumbJsonLd,
  jsonLdGraph,
  LEGAL_NAMES,
  pageMetadata,
  pagePath,
  webPageJsonLd,
} from "@/lib/seo";
import { isLang, type Lang, type Localized } from "@/lib/types";

const TITLE: Localized = {
  ka: "კომფორტ ბილდინგის შესახებ",
  en: "About Comfort Building",
  ru: "О компании Comfort Building",
};

const LEDE: Localized = {
  ka: "კომფორტ ბილდინგი სამშენებლო კომპანიაა ბათუმში. მისი საცხოვრებელი პროექტები მდებარეობს ბათუმსა და თბილისში. აქ შეგიძლიათ გაეცნოთ კომპანიის პორტფოლიოს, ოფისის მისამართსა და პირდაპირ საკონტაქტო ინფორმაციას.",
  en: "Comfort Building is a construction company based in Batumi, with residential projects in Batumi and Tbilisi. Explore its project portfolio, office address, and direct contact details.",
  ru: "Comfort Building — строительная компания в Батуми с жилыми проектами в Батуми и Тбилиси. Здесь представлены портфолио, адрес офиса и прямые контакты компании.",
};

const PROFILE = {
  ka: {
    heading: "სამშენებლო კომპანია ბათუმში, კონკრეტული პროექტებით",
    legalName: "კომპანიის დასახელება",
    office: "ბათუმის ოფისი",
    portfolio: "საცხოვრებელი პროექტები",
    portfolioValue: `${PROJECTS.length} მიმდინარე და დასრულებული პროექტი ბათუმსა და თბილისში`,
    apartments: "გასაყიდი ბინები ბათუმში",
    projects: "მიმდინარე და დასრულებული პროექტების ნახვა",
  },
  en: {
    heading: "A Batumi construction company with a documented portfolio",
    legalName: "Company name",
    office: "Batumi office",
    portfolio: "Residential portfolio",
    portfolioValue: `${PROJECTS.length} current and completed projects in Batumi and Tbilisi`,
    apartments: "Apartments for sale in Batumi",
    projects: "Explore current and completed projects",
  },
  ru: {
    heading: "Строительная компания в Батуми с портфолио проектов",
    legalName: "Название компании",
    office: "Офис в Батуми",
    portfolio: "Жилые проекты",
    portfolioValue: `${PROJECTS.length} текущих и завершённых проектов в Батуми и Тбилиси`,
    apartments: "Квартиры в продаже в Батуми",
    projects: "Текущие и завершённые проекты",
  },
} as const;

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
  const profile = PROFILE[lang];

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

      <section className="draft-grid bg-basalt py-16 md:py-24">
        <div className="wrap grid gap-12 lg:grid-cols-12 lg:gap-20">
          <div className="lg:col-span-5">
            <p className="eyebrow">{COMPANY_NAME[lang]}</p>
            <h2 className="mt-5 font-display text-3xl leading-tight text-cream md:text-4xl">
              {profile.heading}
            </h2>
            <Link href={`/${lang}/apartments`} className="link-slide mt-8 inline-flex min-h-11 items-center gap-3 text-sm text-brass">
              {profile.apartments} <span aria-hidden>→</span>
            </Link>
          </div>
          <div className="lg:col-span-7">
            <dl className="border-t border-cream/15">
              {[
                [profile.legalName, LEGAL_NAMES[lang]],
                [profile.office, CONTACT.address[lang]],
                [profile.portfolio, profile.portfolioValue],
              ].map(([label, value]) => (
                <div key={label} className="grid gap-3 border-b border-cream/15 py-6 sm:grid-cols-[10rem_1fr]">
                  <dt className="font-mono text-xs leading-relaxed text-cream/50">{label}</dt>
                  <dd className="text-base leading-relaxed text-cream/85">{value}</dd>
                </div>
              ))}
            </dl>
            <Link href={`/${lang}/projects`} className="link-slide mt-5 inline-flex min-h-11 items-center gap-3 text-sm text-brass">
              {profile.projects} <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </section>

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
