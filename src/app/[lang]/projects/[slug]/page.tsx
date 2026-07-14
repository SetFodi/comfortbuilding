import type { Metadata } from "next";
import Image, { getImageProps } from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContactBand } from "@/components/contact-band";
import { Gallery } from "@/components/gallery";
import { PlanViewer } from "@/components/plan-viewer";
import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/section-heading";
import { StatusChip } from "@/components/status-chip";
import { TitleBlock } from "@/components/title-block";
import { getDict } from "@/lib/dictionary";
import { getProject, PROJECTS } from "@/lib/projects";
import { CONTACT } from "@/lib/site";
import { isLang, type Lang, type Localized } from "@/lib/types";

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

interface ProjectPageProps {
  readonly params: Promise<{ lang: string; slug: string }>;
}

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
  return {
    title: project.name[lang],
    description: project.summary[lang],
    alternates: {
      canonical: `/${lang}/projects/${project.slug}`,
      languages: {
        ka: `/ka/projects/${project.slug}`,
        en: `/en/projects/${project.slug}`,
        ru: `/ru/projects/${project.slug}`,
      },
    },
    openGraph: {
      title: project.name[lang],
      description: project.summary[lang],
      images: [heroImage.src],
    },
  };
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
    { label: dict.titleBlock.floors, value: project.floorsLabel },
    { label: dict.titleBlock.start, value: project.startDate[lang] },
    { label: dict.titleBlock.completion, value: project.endDate[lang] },
    ...(project.areasLabel
      ? [{ label: dict.titleBlock.areas, value: project.areasLabel[lang] }]
      : []),
    ...(project.priceFrom
      ? [{ label: dict.titleBlock.price, value: project.priceFrom[lang] }]
      : []),
  ];

  return (
    <>
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
              project.priceFrom) && (
              <Reveal className="lg:col-span-5" delayMs={120}>
                <aside className="border border-ink/20 bg-paper p-6 md:p-8">
                  <p className="eyebrow eyebrow-on-light">
                    {PUBLISHED_FIGURES[lang]}
                  </p>

                  {project.soldPercent !== undefined && (
                    <div className="mt-8">
                      <div className="flex items-end justify-between gap-4">
                        <span className="text-sm text-ink/65">{dict.misc.sold}</span>
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

                  {project.priceFrom && (
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
                          <dd className="font-mono text-xl text-ink">{item.value}</dd>
                        </div>
                      ))}
                    </dl>
                  )}

                  <p className="mt-6 text-xs leading-relaxed text-ink/65">
                    {dict.misc.sourceData}
                  </p>
                  <a
                    href={CONTACT.phoneHref}
                    className="mt-6 inline-flex min-h-11 w-full items-center justify-center bg-ink px-5 text-sm font-semibold text-cream transition-colors hover:bg-iron"
                  >
                    {dict.cta.call}
                  </a>
                </aside>
              </Reveal>
            )}
          </div>
        </section>

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

        <section className="bg-limestone py-24 text-ink md:py-32">
          <div className="wrap grid gap-10 lg:grid-cols-12 lg:items-stretch">
            <Reveal className="lg:col-span-4">
              <p className="eyebrow eyebrow-on-light">{dict.sections.location}</p>
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
            <Reveal className="min-h-80 overflow-hidden border border-ink/15 lg:col-span-8" delayMs={100}>
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

      <ContactBand lang={lang} dict={dict} />
    </>
  );
}
