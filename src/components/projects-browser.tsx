"use client";

import Link from "next/link";
import { useState } from "react";
import type { Lang, ProjectStatus } from "@/lib/types";
import { ProjectMedia } from "./project-media";
import { StatusChip } from "./status-chip";

type Filter = "all" | ProjectStatus;

export interface ProjectBrowserItem {
  readonly slug: string;
  readonly name: string;
  readonly city: string;
  readonly address: string;
  readonly summary: string;
  readonly floors: string;
  readonly startYear: number;
  readonly endYear: number;
  readonly status: ProjectStatus;
  readonly accent: string;
  readonly image: { readonly src: string; readonly alt: string };
}

interface ProjectsBrowserProps {
  readonly lang: Lang;
  readonly projects: readonly ProjectBrowserItem[];
  readonly labels: {
    readonly all: string;
    readonly ongoing: string;
    readonly completed: string;
    readonly view: string;
    readonly floors: string;
    readonly filterLabel: string;
  };
}

/** A filterable architectural dossier index with localized, lean view data. */
export function ProjectsBrowser({
  lang,
  projects,
  labels,
}: ProjectsBrowserProps) {
  const [filter, setFilter] = useState<Filter>("all");
  const visible =
    filter === "all"
      ? projects
      : projects.filter((project) => project.status === filter);

  const filters: readonly { key: Filter; label: string }[] = [
    { key: "all", label: labels.all },
    { key: "ongoing", label: labels.ongoing },
    { key: "completed", label: labels.completed },
  ];

  return (
    <div>
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label={labels.filterLabel}
      >
        {filters.map((item) => {
          const count =
            item.key === "all"
              ? projects.length
              : projects.filter((project) => project.status === item.key).length;

          return (
            <button
              key={item.key}
              type="button"
              aria-pressed={filter === item.key}
              onClick={() => setFilter(item.key)}
              className={`inline-flex min-h-11 items-center gap-3 border px-5 font-mono text-xs tracking-[0.12em] uppercase transition-colors ${
                filter === item.key
                  ? "border-brass bg-brass text-ink"
                  : "border-cream/20 text-cream/70 hover:border-cream/50 hover:text-cream"
              }`}
            >
              {item.label}
              <span className="opacity-65">{String(count).padStart(2, "0")}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-14 border-t border-cream/15">
        {visible.map((project, index) => (
          <article
            key={project.slug}
            className="group relative grid gap-8 border-b border-cream/15 py-10 lg:grid-cols-12 lg:items-center lg:gap-12 lg:py-16"
          >
            <div
              className={`relative block aspect-[16/10] overflow-hidden lg:col-span-7 ${
                index % 2 === 1 ? "lg:order-2" : ""
              }`}
            >
              <ProjectMedia
                src={project.image.src}
                alt={project.image.alt}
                sizes="(min-width: 1440px) 755px, (min-width: 1024px) 58vw, 100vw"
                className="h-full w-full"
                foregroundClassName="p-3 sm:p-5"
              />
              <span
                className="absolute inset-y-0 left-0 w-1"
                style={{ backgroundColor: project.accent }}
                aria-hidden
              />
            </div>

            <div
              className={`lg:col-span-5 ${index % 2 === 1 ? "lg:order-1" : ""}`}
            >
              <div className="flex items-start justify-between gap-6">
                <span className="font-mono text-5xl font-medium text-cream/50 md:text-7xl">
                  {String(projects.indexOf(project) + 1).padStart(2, "0")}
                </span>
                <StatusChip
                  status={project.status}
                  label={
                    project.status === "ongoing"
                      ? labels.ongoing
                      : labels.completed
                  }
                />
              </div>
              <h2 className="mt-6 font-display text-3xl leading-tight font-medium text-cream md:text-5xl">
                <Link
                  href={`/${lang}/projects/${project.slug}`}
                  className="transition-colors after:absolute after:inset-0 after:z-10 after:content-[''] group-hover:text-brass focus-visible:after:outline-2 focus-visible:after:outline-offset-[-2px] focus-visible:after:outline-brass"
                >
                  {project.name}
                </Link>
              </h2>
              <p className="mt-5 text-[15px] leading-relaxed text-cream/70">
                {project.summary}
              </p>
              <dl className="mt-8 grid grid-cols-2 border-y border-cream/15 py-5 text-sm">
                <div>
                  <dt className="font-mono text-[10px] tracking-[0.16em] text-cream/60 uppercase">
                    {project.startYear}—{project.endYear}
                  </dt>
                  <dd className="mt-2 text-cream/80">
                    {project.city} · {project.address}
                  </dd>
                </div>
                <div className="border-l border-cream/15 pl-5">
                  <dt className="font-mono text-[10px] tracking-[0.16em] text-cream/60 uppercase">
                    {labels.floors}
                  </dt>
                  <dd className="mt-2 font-mono text-cream/80">{project.floors}</dd>
                </div>
              </dl>
              <span
                aria-hidden
                className="mt-7 inline-flex min-h-11 items-center gap-3 text-sm font-semibold text-brass"
              >
                {labels.view} <span aria-hidden>→</span>
              </span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
