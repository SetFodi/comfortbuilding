import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/json-ld";
import { PageHero } from "@/components/page-hero";
import {
  ProjectsBrowser,
  type ProjectBrowserItem,
} from "@/components/projects-browser";
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
import { isLang, type Lang, type Localized } from "@/lib/types";

const TITLE: Localized = {
  ka: "საცხოვრებელი პროექტები",
  en: "Residential projects",
  ru: "Жилые проекты",
};

const LEDE: Localized = {
  ka: "კომპანიის ოფიციალურ ვებსაიტზე გამოქვეყნებული ექვსივე საცხოვრებელი პროექტი — ერთიან, გასაგებ რეესტრში.",
  en: "All six residential projects published on the company’s official website — brought together in one clear register.",
  ru: "Все шесть жилых проектов с официального сайта компании — в едином понятном реестре.",
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
    title: TITLE[lang],
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
    </>
  );
}
