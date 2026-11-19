import Image from "next/image";
import Link from "next/link";
import type { Lang, Project, ProjectStatus } from "@/lib/types";

export interface PortfolioCardItem {
  readonly slug: string;
  readonly name: string;
  readonly city: string;
  readonly address: string;
  readonly status: ProjectStatus;
  readonly image: { readonly src: string; readonly alt: string };
}

export function portfolioCardItem(project: Project, lang: Lang): PortfolioCardItem {
  const image = project.listingImage ?? project.cover;
  return {
    slug: project.slug, name: project.name[lang], city: project.city[lang],
    address: project.address[lang], status: project.status,
    image: { src: image.src, alt: image.alt[lang] },
  };
}

export function PortfolioCard({ lang, project, statusLabel, sizes }: {
  readonly lang: Lang;
  readonly project: PortfolioCardItem;
  readonly statusLabel: string;
  readonly sizes: string;
}) {
  const viewLabel = { en: "Visualization", ka: "ვიზუალიზაცია", ru: "Визуализация" }[lang];
  return (
    <Link className="portfolio-card" href={`/${lang}/projects/${project.slug}`}>
      <div className="portfolio-frame">
        <Image src={project.image.src} alt={project.image.alt} fill sizes={sizes} className="portfolio-image" />
        <span className="project-state" data-current={project.status === "ongoing"}>
          <i aria-hidden />{statusLabel}
        </span>
      </div>
      <div className="portfolio-caption">
        <div>
          <p className="small-label">
            {project.city}{project.image.src.startsWith("/images/experimental-ai/") && ` · ${viewLabel}`}
          </p>
          <h3>{project.name}</h3>
        </div>
        <span className="round-open" aria-hidden>↗</span>
      </div>
      {project.address !== project.name && <p className="portfolio-address">{project.address}</p>}
    </Link>
  );
}
