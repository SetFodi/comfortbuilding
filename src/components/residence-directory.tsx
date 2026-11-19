"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Lang } from "@/lib/types";
import type { PortfolioCardItem } from "./portfolio-card";

const COPY = {
  en: { title: "Our projects", all: "Both cities", archive: "Project archive", city: "Filter by city", open: "View project", image: "Architectural visualization" },
  ka: { title: "ჩვენი პროექტები", all: "ორივე ქალაქი", archive: "პროექტების არქივი", city: "ქალაქის არჩევა", open: "პროექტის ნახვა", image: "არქიტექტურული ვიზუალიზაცია" },
  ru: { title: "Наши проекты", all: "Оба города", archive: "Архив проектов", city: "Выбор города", open: "О проекте", image: "Архитектурная визуализация" },
} as const;

export function ResidenceDirectory({ lang, projects, status }: {
  readonly lang: Lang;
  readonly projects: readonly PortfolioCardItem[];
  readonly status: Readonly<Record<PortfolioCardItem["status"], string>>;
}) {
  const copy = COPY[lang];
  const [city, setCity] = useState<string | null>(null);
  const [previewSlug, setPreviewSlug] = useState<string>();
  const cities = Array.from(new Set(projects.map((project) => project.city)));
  const visible = city === null ? projects : projects.filter((project) => project.city === city);
  const preview = visible.find((project) => project.slug === previewSlug) ?? visible[0];
  if (!preview) return null;

  return (
    <section className="residence-directory" id="collection">
      <div className="directory-heading">
        <h2>{copy.title}<sup>{String(projects.length).padStart(2, "0")}</sup></h2>
        <div className="directory-filters" role="group" aria-label={copy.city}>
          {[null, ...cities].map((option) => (
            <button key={option ?? "all"} type="button" aria-pressed={option === city}
              onClick={() => { setCity(option); setPreviewSlug(undefined); }}>
              {option ?? copy.all}
            </button>
          ))}
        </div>
      </div>
      <div className="directory-body">
        <Link href={`/${lang}/projects/${preview.slug}`} className="directory-plate" aria-label={`${copy.open} · ${preview.name}`}>
          <div className="directory-image" data-drift>
            <Image key={preview.slug} src={preview.image.src} alt={preview.image.alt} fill sizes="(min-width: 801px) 55vw, 100vw" />
            {preview.image.src.startsWith("/images/experimental-ai/") && <span className="visual-credit">{copy.image}</span>}
          </div>
          <div className="directory-image-caption"><strong>{preview.address}</strong><span>{preview.city} ↗</span></div>
        </Link>
        <div className="directory-list">
          {visible.map((project) => (
            <Link href={`/${lang}/projects/${project.slug}`} key={project.slug} className="directory-row"
              data-preview={project.slug === preview.slug}
              onFocus={() => setPreviewSlug(project.slug)}
              onPointerEnter={(event) => { if (event.pointerType === "mouse") setPreviewSlug(project.slug); }}>
              <span><small>{project.city} · {status[project.status]}</small><strong>{project.name}</strong></span>
              <i aria-hidden>↗</i>
            </Link>
          ))}
          <Link className="directory-archive" href={`/${lang}/projects`}>{copy.archive}<span aria-hidden>→</span></Link>
        </div>
      </div>
    </section>
  );
}
