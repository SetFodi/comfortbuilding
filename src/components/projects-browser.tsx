"use client";

import { useState } from "react";
import type { Lang, ProjectStatus } from "@/lib/types";
import { PortfolioCard, type PortfolioCardItem } from "./portfolio-card";

type Filter = "all" | ProjectStatus;

export interface ProjectBrowserItem extends PortfolioCardItem {
  readonly summary: string;
  readonly floors: string;
  readonly period: string;
}

interface ProjectsBrowserProps {
  readonly lang: Lang;
  readonly projects: readonly ProjectBrowserItem[];
  readonly labels: {
    readonly all: string;
    readonly ongoing: string;
    readonly completed: string;
    readonly floors: string;
    readonly filterLabel: string;
  };
}

export function ProjectsBrowser({ lang, projects, labels }: ProjectsBrowserProps) {
  const [filter, setFilter] = useState<Filter>("all");
  const visible = projects.filter((project) => filter === "all" || project.status === filter);
  return (
    <div>
      <div className="portfolio-filters" role="group" aria-label={labels.filterLabel}>
        {(["all", "ongoing", "completed"] as const).map((key) => (
          <button key={key} type="button" aria-pressed={filter === key} onClick={() => setFilter(key)}>
            {labels[key]}<small>{projects.filter((project) => key === "all" || project.status === key).length}</small>
          </button>
        ))}
      </div>
      <div className="portfolio-grid archive-grid">
        {visible.map((project) => (
          <article key={project.slug}>
            <PortfolioCard lang={lang} project={project} statusLabel={labels[project.status]} sizes="(min-width: 720px) 47vw, 100vw" />
            <p className="archive-summary">{project.summary}</p>
            <p className="archive-meta">{labels.floors} · {project.floors}<span>{project.period}</span></p>
          </article>
        ))}
      </div>
    </div>
  );
}
