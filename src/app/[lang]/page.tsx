import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AvailableApartmentsSpotlight } from "@/components/available-apartments-spotlight";
import { Hero, DUSK_COVER } from "@/components/hero";
import { JsonLd } from "@/components/json-ld";
import { LayoutShelf } from "@/components/layout-shelf";
import { LandingMotion } from "@/components/landing-motion";
import { ResidenceDirectory } from "@/components/residence-directory";
import { portfolioCardItem } from "@/components/portfolio-card";
import { ResidenceStory } from "@/components/residence-story";
import { getDict } from "@/lib/dictionary";
import { findPlanUnit, planPoints, PARNAVAZ_PLAN } from "@/lib/parnavaz-floor-plans";
import { getProject, PROJECTS } from "@/lib/projects";
import { COMPANY_NAME } from "@/lib/site";
import { HOME_DESCRIPTIONS, jsonLdGraph, pageMetadata, webPageJsonLd } from "@/lib/seo";
import { isLang, type Lang, type Localized } from "@/lib/types";

const PAGE_TITLE: Localized = {
  ka: "სამშენებლო კომპანია ბათუმში",
  en: "Construction company in Batumi",
  ru: "Строительная компания в Батуми",
};

const COPY = {
  en: { about: "Comfort Building", since: "Building since 2014", company: "Our first projects took shape in Batumi. Today our portfolio spans seven residential buildings in Batumi and Tbilisi." },
  ka: { about: "კომფორტ ბილდინგი", since: "2014 წლიდან", company: "ჩვენი პირველი პროექტები ბათუმში აშენდა. დღეს ჩვენი შვიდი საცხოვრებელი სახლი ბათუმსა და თბილისში მდებარეობს." },
  ru: { about: "Комфорт Билдинг", since: "Строим с 2014 года", company: "Наши первые дома появились в Батуми. Сегодня в нашем портфолио семь жилых домов в Батуми и Тбилиси." },
} as const;

const PIAZZA = getProject("house-near-piazza")!;
const DIRECTORY = [PIAZZA, ...PROJECTS.filter((project) => project.slug !== PIAZZA.slug)];
const FEATURED = getProject("parnavaz-65")!;
const UNIT = FEATURED.priceList?.units.find((unit) => unit.totalArea === 46.5);
const PLAN = UNIT && findPlanUnit(UNIT.number);

interface HomePageProps { readonly params: Promise<{ lang: string }>; }

async function resolveLang(params: HomePageProps["params"]): Promise<Lang> {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return lang;
}

export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const lang = await resolveLang(params);
  return pageMetadata({
    lang, title: `${PAGE_TITLE[lang]} — ${COMPANY_NAME[lang]}`,
    description: HOME_DESCRIPTIONS[lang], image: DUSK_COVER,
  });
}

export default async function HomePage({ params }: HomePageProps) {
  const lang = await resolveLang(params);
  const dict = getDict(lang);
  const copy = COPY[lang];
  const areaUnit = { en: "m²", ru: "м²", ka: "მ²" }[lang];
  const areaFormat = new Intl.NumberFormat(lang);

  return (
    <LandingMotion>
      <JsonLd data={jsonLdGraph([webPageJsonLd(lang, "", PAGE_TITLE[lang], HOME_DESCRIPTIONS[lang])])} />
      <Hero lang={lang} dict={dict} heading={PAGE_TITLE[lang]} projects={PROJECTS} />
      <div id="homepage-analytics-preferences" />
      <ResidenceDirectory lang={lang} projects={DIRECTORY.map((project) => portfolioCardItem(project, lang))} status={dict.status} />
      {UNIT && PLAN && (
        <ResidenceStory lang={lang} name={FEATURED.name[lang]} floor={UNIT.floor} number={UNIT.number}
          area={`${areaFormat.format(UNIT.totalArea)} ${areaUnit}`}
          floorImage={PLAN.plan.image.src} outline={planPoints(PLAN.unit.points)}
          planViewBox={`0 0 ${PARNAVAZ_PLAN.width} ${PARNAVAZ_PLAN.height}`}
          projectHref={`/${lang}/projects/${FEATURED.slug}`} />
      )}
      {FEATURED.layouts && (
        <LayoutShelf lang={lang} project={FEATURED.name[lang]} layouts={FEATURED.layouts.map((layout) => {
          const apartment = FEATURED.priceList?.units.find((unit) => unit.totalArea === layout.totalArea);
          const path = `/${lang}/projects/${FEATURED.slug}`;
          return {
            id: layout.id, area: areaFormat.format(layout.totalArea), bedrooms: layout.bedrooms,
            href: apartment ? `${path}?apartment=${apartment.number}#explore` : `${path}#layouts`,
          };
        })} />
      )}
      <AvailableApartmentsSpotlight lang={lang} />
      <section className="studio-company">
        <div className="company-image" data-drift>
          <Image src="/images/projects/house-near-piazza/street.jpg" alt={PIAZZA.name[lang]} fill sizes="(min-width: 601px) 50vw, 100vw" />
        </div>
        <div className="studio-wrap">
          <p className="studio-label"><i aria-hidden />{copy.since}</p>
          <h2 className="monograph-title">{copy.about}</h2>
          <p className="company-history">{copy.company}</p>
          <div className="studio-actions">
            <Link href={`/${lang}/about`} className="studio-button">{dict.cta.aboutUs}<span aria-hidden>↗</span></Link>
            <Link href={`/${lang}/contact`} className="studio-text-link">{dict.nav.contact}</Link>
          </div>
        </div>
      </section>
    </LandingMotion>
  );
}
