import type { Metadata } from "next";
import Image, { getImageProps } from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ApartmentLayouts } from "@/components/apartment-layouts";
import { ContactBand } from "@/components/contact-band";
import { Gallery } from "@/components/gallery";
import { JsonLd } from "@/components/json-ld";
import { PlanViewer } from "@/components/plan-viewer";
import { ParnavazExplorer } from "@/components/parnavaz-explorer";
import { PriceContact } from "@/components/price-contact";
import { ProjectPriceList } from "@/components/project-price-list";
import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/section-heading";
import { StatusChip } from "@/components/status-chip";
import { TitleBlock } from "@/components/title-block";
import { UnitInventory } from "@/components/unit-inventory";
import { ViewBoundary } from "@/components/view-boundary";
import { getDict } from "@/lib/dictionary";
import {
  formatUsd,
  getProject,
  priceListSummary,
  projectDate,
  projectFloors,
  PROJECTS,
  ruApartments,
} from "@/lib/projects";
import {
  absoluteUrl,
  breadcrumbJsonLd,
  jsonLdGraph,
  pageMetadata,
  pagePath,
  projectJsonLd,
  projectLayoutsJsonLd,
  webPageJsonLd,
} from "@/lib/seo";
import { CONTACT } from "@/lib/site";
import { isLang, type Lang, type Localized, type Project } from "@/lib/types";

const DOSSIER: Localized = {
  ka: "პროექტის დოსიე",
  en: "Project dossier",
  ru: "Досье проекта",
};

const OVERVIEW: Localized = {
  ka: "პროექტის შესახებ",
  en: "Project overview",
  ru: "О проекте",
};

const PUBLISHED_FIGURES: Localized = {
  ka: "გამოქვეყნებული მონაცემები",
  en: "Published figures",
  ru: "Опубликованные данные",
};

const AVAILABILITY_2026: Localized = {
  ka: "2026 წლის ხელმისაწვდომობა",
  en: "2026 availability",
  ru: "Наличие на 2026 год",
};

const APARTMENTS_AND_AVAILABILITY: Localized = {
  ka: "ბინები და ხელმისაწვდომობა",
  en: "Apartments & availability",
  ru: "Квартиры и наличие",
};

const PRICE_ON_REQUEST: Localized = {
  ka: "მოთხოვნით",
  en: "On request",
  ru: "По запросу",
};

const APARTMENT_LAYOUTS: Localized = {
  ka: "ბინების ტიპები",
  en: "Apartment layouts",
  ru: "Планировки квартир",
};

const VIEW_LAYOUTS: Localized = {
  ka: "ბინების ტიპების ნახვა",
  en: "View apartment layouts",
  ru: "Смотреть планировки",
};

const EXPLORE_APARTMENTS: Localized = {
  ka: "აირჩიეთ სართული",
  en: "Choose a floor",
  ru: "Выбрать этаж",
};

const BUYER_QUESTIONS: Localized = {
  ka: "ხშირი კითხვები",
  en: "Buyer questions",
  ru: "Вопросы покупателей",
};

const SEE_PRICES: Localized = {
  ka: "ფასების ნახვა",
  en: "See prices",
  ru: "Смотреть цены",
};

const LAYOUTS_PRICED_NOTE: Localized = {
  ka: "გეგმები და ინტერიერები საკონცეფციოა და შეიძლება შეიცვალოს. ფასი მითითებულია 1 მ²-ზე და დამოკიდებულია სართულზე.",
  en: "Layouts and interiors are design concepts and may change. Prices are per m² and depend on the floor.",
  ru: "Планировки и интерьеры — дизайн-концепции и могут измениться. Цена указана за м² и зависит от этажа.",
};

const LAYOUTS_NOTE: Localized = {
  ka: "გეგმები და ინტერიერები საკონცეფციოა და შეიძლება შეიცვალოს. ფასისა და დეტალებისთვის დაუკავშირდით გაყიდვების გუნდს.",
  en: "Layouts and interiors are design concepts and may change. Call or email the sales team for prices and details.",
  ru: "Планировки и интерьеры — дизайн-концепции и могут измениться. Цены и подробности уточняйте в отделе продаж.",
};

function formatArea(value: number, lang: Lang) {
  return lang === "ru" ? String(value).replace(".", ",") : String(value);
}

function layoutRange(project: Project, lang: Lang) {
  const areas = (project.layouts ?? []).map((layout) => layout.totalArea);
  return {
    count: areas.length,
    min: formatArea(Math.min(...areas), lang),
    max: formatArea(Math.max(...areas), lang),
  };
}

/** Starting price for apartments of this size on the published price list. */
function layoutPrice(project: Project, totalArea: number) {
  const units = (project.priceList?.units ?? []).filter(
    (unit) => unit.totalArea === totalArea,
  );
  if (units.length === 0) return undefined;
  return {
    from: formatUsd(Math.min(...units.map((unit) => unit.pricePerSqm))),
    forSale: units.length,
  };
}

function layoutsTitle(project: Project, lang: Lang) {
  const { count, min, max } = layoutRange(project, lang);
  if (lang === "ka") return `${count} ტიპის ბინა — ${min}-დან ${max} მ²-მდე`;
  if (lang === "ru") return `${count} планировок от ${min} до ${max} м²`;
  return `${count} layouts from ${min} to ${max} m²`;
}

/**
 * The project name as searched: Georgian and Russian names get the Latin
 * name people type ("რედ ლაინი (Red Line)").
 */
function searchLabel(project: Project, lang: Lang): string {
  const name = project.name[lang];
  const latin = project.searchNames?.[0];
  if (lang === "en" || !latin || name.includes(latin)) return name;
  return `${name} (${latin})`;
}

/** "Red Line, Batumi", but not "Grand House Tbilisi, Tbilisi". */
function withCity(name: string, city: string): string {
  return name.includes(city) ? name : `${name}, ${city}`;
}

function projectMetaTitle(project: Project, lang: Lang): string {
  const label = searchLabel(project, lang);

  if (project.priceList) {
    const from = formatUsd(priceListSummary(project.priceList).minRate);
    if (lang === "ka") {
      return `${label} — ბინები ბათუმში ${from}-დან მ²-ზე`;
    }
    if (lang === "ru") {
      return `${label} — новостройка в Батуми, квартиры от ${from} за м²`;
    }
    return `${label} — apartments for sale in Batumi from ${from}/m²`;
  }

  if (project.layouts) {
    if (lang === "ka") {
      return `${label} — იყიდება ბინები ბათუმში, მშენებარე სახლი`;
    }
    if (lang === "ru") {
      return `${label} — новостройка в Батуми, квартиры от застройщика`;
    }
    return `${label} — new apartments for sale in Batumi`;
  }

  if (project.inventory) {
    if (lang === "ka") {
      return `${label} | ბინები ბათუმში და ხელმისაწვდომობა`;
    }
    if (lang === "ru") {
      return `${label} | квартиры в Батуми и наличие`;
    }
    return `${label} Batumi apartments | Availability and sales contact`;
  }

  // Completed buildings are mostly searched by name or street address.
  return `${withCity(label, project.city[lang])} — ${project.address[lang]}`;
}

function projectMetaDescription(project: Project, lang: Lang): string {
  if (project.priceList) {
    const { count, minRate, minArea, maxArea } = priceListSummary(
      project.priceList,
    );
    const from = formatUsd(minRate);
    const min = formatArea(minArea, lang);
    const max = formatArea(maxArea, lang);
    const floors = project.floorsLabel;
    const parking = project.priceList.parking;
    if (lang === "ka") {
      return `${project.name.ka} — მშენებარე ${floors ? `${floors}-სართულიანი ` : ""}სახლი ბათუმში, ${project.address.ka}. იყიდება ${count} ბინა, ${min}–${max} მ², ფასი ${from}-დან მ²-ზე.${parking ? ` ავტოსადგომი — ${formatUsd(parking.price)}.` : ""}`;
    }
    if (lang === "ru") {
      return `${project.name.ru} — строящийся ${floors ? `${floors}-этажный ` : ""}дом в Батуми, ${project.address.ru}. В продаже ${count} ${ruApartments(count)}, ${min}–${max} м², от ${from} за м².${parking ? ` Парковка — ${formatUsd(parking.price)}.` : ""}`;
    }
    return `${project.name.en}: ${floors ? `${floors}-storey ` : "new "}building under construction at ${project.address.en}, Batumi. ${count} apartments for sale, ${min}–${max} m², from ${from} per m².${parking ? ` Parking ${formatUsd(parking.price)}.` : ""}`;
  }

  if (project.layouts) {
    const { count, min, max } = layoutRange(project, lang);
    const floors = project.floorsLabel;
    if (lang === "ka") {
      return `${project.name.ka} — მშენებარე ${floors ? `${floors}-სართულიანი ` : ""}საცხოვრებელი სახლი ბათუმში, ${project.address.ka}. იყიდება ბინები ${min}-დან ${max} მ²-მდე, ${count} ტიპის გეგმა. ფასისთვის დაგვირეკეთ ან მოგვწერეთ.`;
    }
    if (lang === "ru") {
      return `${project.name.ru} — строящийся ${floors ? `${floors}-этажный ` : ""}жилой дом в Батуми, ${project.address.ru}. Квартиры от ${min} до ${max} м², ${count} планировок. Цены — по телефону или почте.`;
    }
    return `${project.name.en}: a new ${floors ? `${floors}-storey ` : ""}building under construction at ${project.address.en}, Batumi. Apartments for sale from ${min} to ${max} m², ${count} layouts. Call or email for prices.`;
  }

  const hasInventory = Boolean(project.inventory);
  if (lang === "ka") {
    const city = project.city.ka === "ბათუმი" ? "ბათუმში" : "თბილისში";
    return `${project.name.ka} — საცხოვრებელი პროექტი ${city}, ${project.address.ka}. იხილეთ ფოტოები, მახასიათებლები, მდებარეობა${hasInventory ? " და ბინების ხელმისაწვდომობა" : " და გამოქვეყნებული მონაცემები"}.`;
  }
  if (lang === "ru") {
    return `${project.name.ru} — жилой проект в ${project.city.ru}, ${project.address.ru}. Фото, характеристики, расположение${hasInventory ? " и наличие квартир" : " и опубликованные данные"}.`;
  }
  return `${project.name.en} is a residential project in ${project.city.en} at ${project.address.en}. View photos, specifications, location${hasInventory ? ", and apartment availability" : ", and published details"}.`;
}

interface ProjectPageProps {
  readonly params: Promise<{ lang: string; slug: string }>;
}


/** Shown in place of the floor and apartment explorer if it fails in a browser. */
const EXPLORER_ERROR = {
  ka: { message: "ბინების ინტერაქტიული არჩევა ამ ბრაუზერში ვერ ჩაიტვირთა. ქვემოთ ნახავთ ფასებსა და ბინების დიზაინებს.", retry: "ხელახლა ცდა" },
  en: { message: "The interactive apartment picker couldn't load in this browser. Prices and apartment designs are below.", retry: "Try again" },
  ru: { message: "Интерактивный выбор квартир не загрузился в этом браузере. Цены и дизайны квартир ниже.", retry: "Попробовать снова" },
} as const;
export function generateStaticParams() {
  return PROJECTS.map((project) => ({ slug: project.slug }));
}

export const dynamicParams = false;

async function resolveProject(params: ProjectPageProps["params"]) {
  const { lang, slug } = await params;
  if (!isLang(lang)) notFound();
  const project = getProject(slug);
  if (!project) notFound();
  return { lang, project } satisfies { lang: Lang; project: typeof project };
}

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const { lang, project } = await resolveProject(params);
  const heroImage = project.heroImage ?? project.listingImage ?? project.cover;
  return pageMetadata({
    lang,
    title: projectMetaTitle(project, lang),
    description: projectMetaDescription(project, lang),
    suffix: `/projects/${project.slug}`,
    image: heroImage,
  });
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { lang, project } = await resolveProject(params);
  const dict = getDict(lang);
  const projectIndex = PROJECTS.findIndex((item) => item.slug === project.slug);
  const nextProject = PROJECTS[(projectIndex + 1) % PROJECTS.length];
  const heroImage = project.heroImage ?? project.listingImage ?? project.cover;
  const mobileHeroImage = project.heroImageMobile ?? heroImage;
  const heroImageCommon = {
    alt: heroImage.alt[lang],
    sizes: "100vw",
    quality: 90,
    loading: "eager" as const,
    fetchPriority: "high" as const,
  };
  const {
    props: { srcSet: desktopHeroSrcSet },
  } = getImageProps({
    ...heroImageCommon,
    src: heroImage.src,
    width: heroImage.width,
    height: heroImage.height,
  });
  const {
    props: { srcSet: mobileHeroSrcSet, ...heroImgProps },
  } = getImageProps({
    ...heroImageCommon,
    alt: mobileHeroImage.alt[lang],
    src: mobileHeroImage.src,
    width: mobileHeroImage.width,
    height: mobileHeroImage.height,
  });
  const pageUrl = absoluteUrl(pagePath(lang, `/projects/${project.slug}`));
  const faqs = project.faqs?.[lang] ?? [];
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(project.mapQuery)}`;
  const mapEmbedUrl = `https://www.google.com/maps?q=${encodeURIComponent(project.mapQuery)}&output=embed`;
  const titleCells = [
    {
      label: dict.titleBlock.location,
      value: `${project.city[lang]}, ${project.address[lang]}`,
    },
    {
      label: dict.titleBlock.status,
      value: dict.status[project.status],
    },
    {
      label: dict.titleBlock.floors,
      value: projectFloors(project, dict.misc.tba),
    },
    {
      label: dict.titleBlock.start,
      value: projectDate(project.startDate, lang, dict.misc.tba),
    },
    {
      label: dict.titleBlock.completion,
      value: projectDate(project.endDate, lang, dict.misc.tba),
    },
    ...(project.areasLabel
      ? [{ label: dict.titleBlock.areas, value: project.areasLabel[lang] }]
      : []),
    ...(project.priceOnRequest
      ? [{ label: dict.titleBlock.price, value: PRICE_ON_REQUEST[lang] }]
      : project.priceFrom
        ? [{ label: dict.titleBlock.price, value: project.priceFrom[lang] }]
        : []),
  ];

  return (
    <>
      <JsonLd
        data={jsonLdGraph([
          {
            ...webPageJsonLd(
              lang,
              `/projects/${project.slug}`,
              projectMetaTitle(project, lang),
              projectMetaDescription(project, lang),
            ),
            mainEntity: { "@id": `${pageUrl}#project` },
          },
          projectJsonLd(project, lang),
          ...projectLayoutsJsonLd(project, lang),
          ...(faqs.length > 0
            ? [
                {
                  "@type": "FAQPage",
                  "@id": `${pageUrl}#faq`,
                  mainEntity: faqs.map((faq) => ({
                    "@type": "Question",
                    name: faq.question,
                    acceptedAnswer: { "@type": "Answer", text: faq.answer },
                  })),
                },
              ]
            : []),
          breadcrumbJsonLd([
            { name: dict.nav.home, path: pagePath(lang) },
            {
              name: dict.nav.projects,
              path: pagePath(lang, "/projects"),
            },
            {
              name: project.name[lang],
              path: pagePath(lang, `/projects/${project.slug}`),
            },
          ]),
        ])}
      />
      <article>
        <section className="relative flex min-h-svh items-end overflow-hidden bg-ink pt-24">
          <div className="hero-media absolute inset-0">
            <picture>
              <source media="(min-width: 768px)" srcSet={desktopHeroSrcSet} />
              <source media="(max-width: 767px)" srcSet={mobileHeroSrcSet} />
              <img
                {...heroImgProps}
                alt={mobileHeroImage.alt[lang]}
                className="absolute inset-0 h-full w-full object-cover object-center"
              />
            </picture>
          </div>
          <div
            className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,13,15,.48)_0%,rgba(11,13,15,.18)_35%,rgba(11,13,15,.94)_100%)]"
            aria-hidden
          />
          <div className="draft-grid absolute inset-0 opacity-30" aria-hidden />

          <div className="wrap hero-stagger relative z-10 pb-12 md:pb-16">
            <Link
              href={`/${lang}/projects`}
              className="eyebrow link-slide inline-flex min-h-11 items-center"
            >
              ← {dict.nav.projects}
            </Link>
            <div className="mt-4 grid items-end gap-8 lg:grid-cols-12">
              <div className="lg:col-span-9">
                <div className="flex items-center gap-4">
                  <span className="font-mono text-sm text-cream/65">
                    {String(projectIndex + 1).padStart(2, "0")} /{" "}
                    {String(PROJECTS.length).padStart(2, "0")}
                  </span>
                  <StatusChip
                    status={project.status}
                    label={dict.status[project.status]}
                  />
                </div>
                <h1 className="mt-5 max-w-6xl font-display text-[clamp(3.3rem,8vw,8.2rem)] leading-[0.9] font-medium tracking-[-0.045em] text-cream">
                  {project.name[lang]}
                </h1>
              </div>
              <p className="max-w-md text-base leading-relaxed text-cream/80 lg:col-span-3">
                {project.summary[lang]}
              </p>
            </div>
          </div>
        </section>

        <section className="border-b border-cream/10 bg-basalt py-6">
          <div className="wrap">
            <TitleBlock cells={titleCells} />
          </div>
        </section>

        <section className="draft-grid-light bg-limestone py-24 text-ink md:py-32">
          <div className="wrap grid gap-14 lg:grid-cols-12 lg:gap-20">
            <Reveal className="lg:col-span-7">
              <p className="eyebrow eyebrow-on-light">{DOSSIER[lang]}</p>
              <h2 className="mt-5 font-display text-4xl leading-tight font-medium md:text-6xl">
                {OVERVIEW[lang]}
              </h2>
              <div className="mt-9 max-w-2xl space-y-6 text-[1.02rem] leading-[1.85] text-ink/75">
                {project.description[lang].map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </Reveal>

            {(project.availability.length > 0 ||
              project.soldPercent !== undefined ||
              project.priceOnRequest ||
              project.priceFrom) && (
              <Reveal className="lg:col-span-5" delayMs={120}>
                <aside className="border border-ink/20 bg-paper p-6 md:p-8">
                  <p className="eyebrow eyebrow-on-light">
                    {PUBLISHED_FIGURES[lang]}
                  </p>

                  {project.soldPercent !== undefined && (
                    <div className="mt-8">
                      <div className="flex items-end justify-between gap-4">
                        <span className="text-sm text-ink/65">
                          {dict.misc.sold}
                        </span>
                        <span className="font-mono text-4xl text-ink">
                          {project.soldPercent}%
                        </span>
                      </div>
                      <div
                        className="mt-3 h-1.5 overflow-hidden bg-ink/10"
                        role="progressbar"
                        aria-label={dict.misc.sold}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={project.soldPercent}
                      >
                        <div
                          className="h-full bg-bronze"
                          style={{ width: `${project.soldPercent}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {project.priceOnRequest ? (
                    <PriceContact
                      lang={lang}
                      projectSlug={project.slug}
                      projectName={project.name[lang]}
                      placement="project-figures"
                      tone="light"
                      className="mt-7 border-t border-ink/15 pt-5"
                    />
                  ) : project.priceFrom && (
                    <div className="mt-7 border-t border-ink/15 pt-5">
                      <p className="font-mono text-[10px] tracking-[0.16em] text-ink/65 uppercase">
                        {dict.titleBlock.price}
                      </p>
                      <p className="mt-2 font-mono text-xl text-ink">
                        {project.priceFrom[lang]}
                      </p>
                    </div>
                  )}

                  {project.availability.length > 0 && (
                    <dl className="mt-7 border-t border-ink/15">
                      {project.availability.map((item) => (
                        <div
                          key={item.label[lang]}
                          className="flex items-end justify-between gap-5 border-b border-ink/15 py-5"
                        >
                          <dt className="text-sm text-ink/70">
                            {item.label[lang]}
                          </dt>
                          <dd className="font-mono text-xl text-ink">
                            {item.value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  )}

                  <p className="mt-6 text-xs leading-relaxed text-ink/65">
                    {project.priceList
                      ? LAYOUTS_PRICED_NOTE[lang]
                      : project.layouts
                        ? LAYOUTS_NOTE[lang]
                        : dict.misc.sourceData}
                  </p>
                  {(project.layouts || project.priceList) && (
                    <div className="mt-5 flex flex-wrap gap-x-6">
                      {project.slug === "parnavaz-65" && project.priceList && project.layouts && (
                        <a
                          href="#explore"
                          className="link-slide inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-bronze"
                        >
                          {EXPLORE_APARTMENTS[lang]} <span aria-hidden>↓</span>
                        </a>
                      )}
                      {project.priceList && (
                        <a
                          href="#prices"
                          className="link-slide inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-bronze"
                        >
                          {SEE_PRICES[lang]} <span aria-hidden>↓</span>
                        </a>
                      )}
                      {project.layouts && (
                        <a
                          href="#layouts"
                          className="link-slide inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-bronze"
                        >
                          {VIEW_LAYOUTS[lang]} <span aria-hidden>↓</span>
                        </a>
                      )}
                    </div>
                  )}
                  {!project.priceOnRequest && (
                    <a
                      href={CONTACT.phoneHref}
                      className="mt-6 inline-flex min-h-11 w-full items-center justify-center bg-ink px-5 text-sm font-semibold text-cream transition-colors hover:bg-iron"
                    >
                      {dict.cta.call}
                    </a>
                  )}
                </aside>
              </Reveal>
            )}
          </div>
        </section>

        {project.slug === "parnavaz-65" && project.priceList && project.layouts && (
          <ViewBoundary area="parnavaz-explorer" message={EXPLORER_ERROR[lang].message} retryLabel={EXPLORER_ERROR[lang].retry}>
            <ParnavazExplorer
              lang={lang}
              projectName={project.name[lang]}
              priceList={project.priceList}
              layouts={project.layouts}
            />
          </ViewBoundary>
        )}

        {project.layouts && project.layouts.length > 0 && (
          <section
            id="layouts"
            className="draft-grid-light scroll-mt-20 border-t border-ink/10 bg-paper py-24 text-ink md:py-32"
          >
            <div className="wrap">
              <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
                <div className="lg:col-span-8">
                  <SectionHeading
                    eyebrow={APARTMENT_LAYOUTS[lang]}
                    title={layoutsTitle(project, lang)}
                    onLight
                  />
                </div>
                <p className="max-w-md text-sm leading-relaxed text-ink/65 lg:col-span-4 lg:justify-self-end">
                  {project.priceList
                    ? LAYOUTS_PRICED_NOTE[lang]
                    : LAYOUTS_NOTE[lang]}
                </p>
              </div>
              <div className="mt-12">
                <ApartmentLayouts
                  lang={lang}
                  projectSlug={project.slug}
                  projectName={project.name[lang]}
                  layouts={project.layouts.map((layout) => ({
                    id: layout.id,
                    area: formatArea(layout.totalArea, lang),
                    bedrooms: layout.bedrooms,
                    price: layoutPrice(project, layout.totalArea),
                    image: {
                      src: layout.image.src,
                      width: layout.image.width,
                      height: layout.image.height,
                      alt: layout.image.alt[lang],
                    },
                  }))}
                />
              </div>
            </div>
          </section>
        )}

        {project.priceList && (
          <ProjectPriceList
            lang={lang}
            projectSlug={project.slug}
            projectName={project.name[lang]}
            priceList={project.priceList}
          />
        )}

        {project.inventory && (
          <section
            id="availability"
            className="draft-grid bg-ink py-24 md:py-32"
          >
            <div className="wrap">
              <div className="flex flex-wrap items-end justify-between gap-8">
                <SectionHeading
                  eyebrow={AVAILABILITY_2026[lang]}
                  title={APARTMENTS_AND_AVAILABILITY[lang]}
                />
                <Link
                  href={`/${lang}/apartments`}
                  className="inline-flex min-h-12 items-center bg-brass px-6 text-sm font-semibold text-ink transition-colors hover:bg-brass-bright"
                >
                  {dict.cta.availableApartments} <span aria-hidden>→</span>
                </Link>
              </div>
              <div className="mt-12">
                <UnitInventory
                  inventory={project.inventory}
                  lang={lang}
                  projectSlug={project.slug}
                />
              </div>
            </div>
          </section>
        )}

        {project.features[lang].length > 0 && (
          <section className="bg-ink py-24 md:py-32">
            <div className="wrap">
              <SectionHeading
                eyebrow={DOSSIER[lang]}
                title={dict.sections.features}
              />
              <ol className="mt-14 grid border-t border-cream/15 md:grid-cols-2">
                {project.features[lang].map((feature, index) => (
                  <li
                    key={feature}
                    className="flex gap-6 border-b border-cream/15 py-6 md:odd:border-r md:odd:pr-8 md:even:pl-8"
                  >
                    <span className="font-mono text-xs text-brass">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[15px] leading-relaxed text-cream/80">
                      {feature}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        )}

        {project.floorplans && project.floorplans.length > 0 && (
          <section className="draft-grid-light bg-paper py-24 text-ink md:py-32">
            <div className="wrap">
              <SectionHeading
                eyebrow={dict.sections.floorplans}
                title={project.name[lang]}
                onLight
              />
              <div className="mt-12">
                <PlanViewer
                  images={project.floorplans.map((image) => ({
                    src: image.src,
                    width: image.width,
                    height: image.height,
                    alt: image.alt[lang],
                  }))}
                />
              </div>
            </div>
          </section>
        )}

        {project.gallery.length > 1 && (
          <section className="bg-basalt py-24 md:py-32">
            <div className="wrap">
              <SectionHeading
                eyebrow={dict.sections.gallery}
                title={project.name[lang]}
              />
              <div className="mt-12">
                <Gallery
                  images={project.gallery.map((image) => ({
                    src: image.src,
                    width: image.width,
                    height: image.height,
                    alt: image.alt[lang],
                  }))}
                  labels={{
                    previous: dict.misc.previous,
                    next: dict.misc.next,
                    close: dict.misc.close,
                  }}
                />
              </div>
            </div>
          </section>
        )}

        {faqs.length > 0 && (
          <section className="draft-grid-light bg-paper py-24 text-ink md:py-32">
            <div className="wrap grid gap-14 lg:grid-cols-12 lg:gap-20">
              <div className="lg:col-span-5">
                <p className="eyebrow eyebrow-on-light">
                  {BUYER_QUESTIONS[lang]}
                </p>
                <h2 className="mt-4 font-display text-4xl leading-tight font-medium md:text-6xl">
                  {project.name[lang]}
                </h2>
              </div>
              <div className="border-t border-ink/15 lg:col-span-7">
                {faqs.map((faq) => (
                  <details
                    key={faq.question}
                    className="group border-b border-ink/15"
                  >
                    <summary className="flex min-h-20 cursor-pointer list-none items-center justify-between gap-5 py-5 text-lg font-semibold marker:content-none">
                      {faq.question}
                      <span
                        aria-hidden
                        className="font-mono text-2xl font-normal text-bronze transition-transform group-open:rotate-45"
                      >
                        +
                      </span>
                    </summary>
                    <p className="max-w-2xl pb-7 leading-relaxed text-ink/65">
                      {faq.answer}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="bg-limestone py-24 text-ink md:py-32">
          <div className="wrap grid gap-10 lg:grid-cols-12 lg:items-stretch">
            <Reveal className="lg:col-span-4">
              <p className="eyebrow eyebrow-on-light">
                {dict.sections.location}
              </p>
              <h2 className="mt-5 font-display text-4xl leading-tight font-medium">
                {project.city[lang]}
              </h2>
              <p className="mt-4 leading-relaxed text-ink/70">
                {project.address[lang]}
              </p>
              <a
                href={mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex min-h-11 items-center gap-3 border border-ink px-5 text-sm font-semibold transition-colors hover:bg-ink hover:text-cream"
              >
                {dict.misc.openMap} <span aria-hidden>↗</span>
              </a>
            </Reveal>
            <Reveal
              className="min-h-80 overflow-hidden border border-ink/15 lg:col-span-8"
              delayMs={100}
            >
              <iframe
                src={mapEmbedUrl}
                title={`${project.name[lang]} — ${dict.sections.location}`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-full min-h-80 w-full grayscale-[0.7]"
              />
            </Reveal>
          </div>
        </section>

        <section className="border-y border-cream/15 bg-ink">
          <Link
            href={`/${lang}/projects/${nextProject.slug}`}
            className="group wrap grid gap-8 py-14 md:grid-cols-12 md:items-center md:py-20"
          >
            <div className="md:col-span-7">
              <p className="eyebrow">{dict.cta.nextProject}</p>
              <h2 className="mt-4 font-display text-4xl font-medium text-cream transition-colors group-hover:text-brass md:text-6xl">
                {nextProject.name[lang]}
              </h2>
            </div>
            <div className="relative aspect-[16/9] overflow-hidden md:col-span-4 md:col-start-9">
              <Image
                src={nextProject.cover.src}
                alt={nextProject.cover.alt[lang]}
                fill
                sizes="(min-width: 768px) 32vw, 100vw"
                className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
              />
            </div>
          </Link>
        </section>
      </article>

      <ContactBand lang={lang} dict={dict} projectSlug={project.slug} />
    </>
  );
}
