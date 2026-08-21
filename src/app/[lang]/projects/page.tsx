import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContactBand } from "@/components/contact-band";
import { JsonLd } from "@/components/json-ld";
import { PageHero } from "@/components/page-hero";
import {
  ProjectsBrowser,
  type ProjectBrowserItem,
} from "@/components/projects-browser";
import { SectionHeading } from "@/components/section-heading";
import { getDict } from "@/lib/dictionary";
import { PROJECTS } from "@/lib/projects";
import {
  absoluteUrl,
  breadcrumbJsonLd,
  jsonLdGraph,
  pageMetadata,
  pagePath,
  webPageJsonLd,
} from "@/lib/seo";
import {
  isLang,
  type Lang,
  type Localized,
  type LocalizedList,
} from "@/lib/types";

const TITLE: Localized = {
  ka: "ბინები და საცხოვრებელი პროექტები ბათუმში",
  en: "Apartments and residential projects in Batumi",
  ru: "Квартиры и жилые проекты в Батуми",
};

const LEDE: Localized = {
  ka: "Comfort Building-ის ექვსი მიმდინარე და დასრულებული პროექტი ბათუმსა და თბილისში. შეადარეთ მდებარეობა, სტატუსი, სართულიანობა და გამოქვეყნებული მონაცემები.",
  en: "Six current and completed Comfort Building projects in Batumi and Tbilisi. Compare location, status, floors, and published details.",
  ru: "Шесть текущих и завершённых проектов Comfort Building в Батуми и Тбилиси. Сравните расположение, статус, этажность и опубликованные данные.",
};

const META_TITLE: Localized = {
  ka: "ბინები ბათუმში და საცხოვრებელი პროექტები",
  en: "New-build apartments and projects in Batumi",
  ru: "Новостройки и квартиры в Батуми от застройщика",
};

const BUYING_TITLE: Localized = {
  ka: "ბინის შეძენა ბათუმში პირდაპირ დეველოპერისგან",
  en: "Buying an apartment directly from the developer",
  ru: "Покупка квартиры в Батуми напрямую у застройщика",
};

const BUYING_COPY: LocalizedList = {
  ka: [
    "თუ ეძებთ გასაყიდ ბინას ბათუმში, Comfort House-ის გამოქვეყნებული ხელმისაწვდომობა ერთ გვერდზე აერთიანებს ფართობებს, სართულებს, გეგმებსა და ფასებს კვადრატულ მეტრზე.",
    "დასრულებული პროექტების არქივი გაჩვენებთ Comfort Building-ის მშენებლობებს ბათუმსა და თბილისში, მათ მისამართებს, პერიოდებს, მახასიათებლებსა და ფოტოებს.",
  ],
  en: [
    "If you are looking for an apartment for sale in Batumi, the published Comfort House inventory puts areas, floors, plans, and rates per square metre on one page.",
    "The completed-project archive records Comfort Building developments in Batumi and Tbilisi with their addresses, dates, specifications, and photographs.",
  ],
  ru: [
    "Если вы ищете квартиру в Батуми от застройщика, опубликованное наличие в Comfort House собрано на одной странице с площадями, этажами, планами и ценами за квадратный метр.",
    "Архив завершённых проектов показывает дома Comfort Building в Батуми и Тбилиси, их адреса, сроки, характеристики и фотографии.",
  ],
};

const IMAGE_ALT: Localized = {
  ka: "სახლი პიაცასთან — გაუმჯობესებული არქიტექტურული ფოტო",
  en: "Enhanced architectural photograph of House near the Piazza",
  ru: "Улучшенная архитектурная фотография дома возле Пьяццы",
};

const HERO_IMAGE = {
  src: "/images/experimental-ai/house-near-piazza-enhanced.png",
  width: 1419,
  height: 1109,
  alt: IMAGE_ALT,
} as const;

interface ProjectsPageProps {
  readonly params: Promise<{ lang: string }>;
}

async function resolveLang(params: ProjectsPageProps["params"]): Promise<Lang> {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return lang;
}

export async function generateMetadata({
  params,
}: ProjectsPageProps): Promise<Metadata> {
  const lang = await resolveLang(params);
  return pageMetadata({
    lang,
    title: META_TITLE[lang],
    description: LEDE[lang],
    suffix: "/projects",
    image: HERO_IMAGE,
  });
}

export default async function ProjectsPage({ params }: ProjectsPageProps) {
  const lang = await resolveLang(params);
  const dict = getDict(lang);
  const projects: readonly ProjectBrowserItem[] = PROJECTS.map((project) => {
    const image = project.listingImage ?? project.cover;

    return {
      slug: project.slug,
      name: project.name[lang],
      city: project.city[lang],
      address: project.address[lang],
      summary: project.summary[lang],
      floors: project.floorsLabel,
      startYear: project.startYear,
      endYear: project.endYear,
      status: project.status,
      accent: project.accent,
      image: { src: image.src, alt: image.alt[lang] },
    };
  });

  return (
    <>
      <JsonLd
        data={jsonLdGraph([
          {
            ...webPageJsonLd(
              lang,
              "/projects",
              TITLE[lang],
              LEDE[lang],
              "CollectionPage",
            ),
            mainEntity: {
              "@type": "ItemList",
              numberOfItems: PROJECTS.length,
              itemListElement: PROJECTS.map((project, index) => ({
                "@type": "ListItem",
                position: index + 1,
                name: project.name[lang],
                url: absoluteUrl(pagePath(lang, `/projects/${project.slug}`)),
              })),
            },
          },
          breadcrumbJsonLd([
            { name: dict.nav.home, path: pagePath(lang) },
            { name: TITLE[lang], path: pagePath(lang, "/projects") },
          ]),
        ])}
      />
      <PageHero
        eyebrow={dict.nav.projects}
        title={TITLE[lang]}
        lede={LEDE[lang]}
        image={HERO_IMAGE.src}
        imageAlt={IMAGE_ALT[lang]}
        annotation="ARCHIVE / 06 PROJECTS / 02 CITIES"
      />

      <section className="draft-grid bg-ink py-20 md:py-28">
        <div className="wrap">
          <ProjectsBrowser
            lang={lang}
            projects={projects}
            labels={{
              all: dict.filters.all,
              ongoing: dict.filters.ongoing,
              completed: dict.filters.completed,
              view: dict.cta.viewProject,
              floors: dict.titleBlock.floors,
              filterLabel: dict.filters.label,
            }}
          />
        </div>
      </section>

      <section className="draft-grid-light bg-limestone py-24 text-ink md:py-32">
        <div className="wrap grid gap-14 lg:grid-cols-12 lg:gap-20">
          <div className="lg:col-span-6">
            <SectionHeading
              eyebrow={dict.nav.apartments}
              title={BUYING_TITLE[lang]}
              onLight
            />
          </div>
          <div className="lg:col-span-6">
            <div className="space-y-6 border-t border-ink/15 pt-6 text-[1.02rem] leading-[1.8] text-ink/70">
              {BUYING_COPY[lang].map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href={`/${lang}/apartments`}
                className="inline-flex min-h-12 items-center bg-ink px-6 text-sm font-semibold text-cream transition-colors hover:bg-iron"
              >
                {dict.cta.availableApartments} <span aria-hidden>→</span>
              </Link>
              <Link
                href={`/${lang}/buying-guide`}
                className="inline-flex min-h-12 items-center border border-ink/25 px-6 text-sm font-semibold text-ink transition-colors hover:border-bronze hover:text-bronze"
              >
                {dict.nav.guide} <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <ContactBand lang={lang} dict={dict} />
    </>
  );
}
