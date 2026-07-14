import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/page-hero";
import {
  ProjectsBrowser,
  type ProjectBrowserItem,
} from "@/components/projects-browser";
import { getDict } from "@/lib/dictionary";
import { PROJECTS } from "@/lib/projects";
import { isLang, type Lang, type Localized } from "@/lib/types";

const TITLE: Localized = {
  ka: "პროექტების არქივი",
  en: "Project archive",
  ru: "Архив проектов",
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
  return {
    title: TITLE[lang],
    description: LEDE[lang],
    alternates: {
      canonical: `/${lang}/projects`,
      languages: {
        ka: "/ka/projects",
        en: "/en/projects",
        ru: "/ru/projects",
      },
    },
  };
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
      <PageHero
        eyebrow={dict.nav.projects}
        title={TITLE[lang]}
        lede={LEDE[lang]}
        image="/images/experimental-ai/house-near-piazza-enhanced.png"
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
