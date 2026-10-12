import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AboutTeaser } from "@/components/about-teaser";
import { AvailableApartmentsSpotlight } from "@/components/available-apartments-spotlight";
import { ContactBand } from "@/components/contact-band";
import { Hero } from "@/components/hero";
import { JsonLd } from "@/components/json-ld";
import {
  ProjectRegister,
  type ProjectRegisterItem,
} from "@/components/project-register";
import { SectionHeading } from "@/components/section-heading";
import { ServicesSection } from "@/components/services-section";
import { StatBand } from "@/components/stat-band";
import { getDict } from "@/lib/dictionary";
import { PROJECTS } from "@/lib/projects";
import { COMPANY_NAME } from "@/lib/site";
import {
  HOME_DESCRIPTIONS,
  jsonLdGraph,
  pageMetadata,
  webPageJsonLd,
} from "@/lib/seo";
import { isLang, type Lang, type Localized } from "@/lib/types";

const PAGE_TITLE: Localized = {
  ka: "სამშენებლო კომპანია ბათუმში",
  en: "Construction company in Batumi",
  ru: "Строительная компания в Батуми",
};

const REGISTER_TITLE: Localized = {
  ka: "საცხოვრებელი პროექტები ბათუმსა და თბილისში",
  en: "Residential projects in Batumi and Tbilisi",
  ru: "Жилые проекты в Батуми и Тбилиси",
};

interface HomePageProps {
  readonly params: Promise<{ lang: string }>;
}

async function resolveLang(params: HomePageProps["params"]): Promise<Lang> {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return lang;
}

export async function generateMetadata({
  params,
}: HomePageProps): Promise<Metadata> {
  const lang = await resolveLang(params);
  const image =
    PROJECTS[0].heroImage ?? PROJECTS[0].listingImage ?? PROJECTS[0].cover;
  return pageMetadata({
    lang,
    title: `${PAGE_TITLE[lang]} — ${COMPANY_NAME[lang]}`,
    description: HOME_DESCRIPTIONS[lang],
    image,
  });
}

export default async function HomePage({ params }: HomePageProps) {
  const lang = await resolveLang(params);
  const dict = getDict(lang);
  const registerItems: readonly ProjectRegisterItem[] = PROJECTS.map(
    (project) => {
      const image = project.listingImage ?? project.cover;

      return {
        slug: project.slug,
        name: project.name[lang],
        city: project.city[lang],
        address: project.address[lang],
        floors: project.floorsLabel,
        startYear: project.startYear,
        endYear: project.endYear,
        status: project.status,
        cover: {
          src: image.src,
          alt: image.alt[lang],
        },
      };
    },
  );

  return (
    <>
      <JsonLd
        data={jsonLdGraph([
          webPageJsonLd(lang, "", PAGE_TITLE[lang], HOME_DESCRIPTIONS[lang]),
        ])}
      />
      <Hero lang={lang} dict={dict} projects={PROJECTS} />
      <StatBand lang={lang} />
      <AvailableApartmentsSpotlight lang={lang} />

      <section className="draft-grid bg-basalt py-24 md:py-32">
        <div className="wrap">
          <div className="flex flex-wrap items-end justify-between gap-8">
            <SectionHeading
              eyebrow={dict.sections.projects}
              title={REGISTER_TITLE[lang]}
              lede={dict.sections.projectsLede}
            />
            <Link
              href={`/${lang}/projects`}
              className="link-slide inline-flex min-h-11 items-center gap-3 text-sm font-semibold text-brass"
            >
              {dict.cta.allProjects} <span aria-hidden>→</span>
            </Link>
          </div>

          <div className="mt-14">
            <ProjectRegister
              lang={lang}
              projects={registerItems}
              labels={{
                floors: dict.titleBlock.floors,
                ongoing: dict.status.ongoing,
                completed: dict.status.completed,
              }}
            />
          </div>
        </div>
      </section>

      <AboutTeaser lang={lang} dict={dict} />
      <ServicesSection lang={lang} dict={dict} />
      <ContactBand lang={lang} dict={dict} />
    </>
  );
}
