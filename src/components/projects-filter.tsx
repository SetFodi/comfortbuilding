"use client";

import { useState } from "react";
import type { Dict } from "@/lib/dictionary";
import type { Lang, Project, ProjectStatus } from "@/lib/types";
import { ProjectCard } from "./project-card";

type Filter = "all" | ProjectStatus;

interface ProjectsFilterProps {
  readonly lang: Lang;
  readonly dict: Dict;
  readonly projects: readonly Project[];
}

export function ProjectsFilter({ lang, dict, projects }: ProjectsFilterProps) {
  const [filter, setFilter] = useState<Filter>("all");

  const filtered =
    filter === "all"
      ? projects
      : projects.filter((project) => project.status === filter);

  const tabs: readonly { key: Filter; label: string; count: number }[] = [
    { key: "all", label: dict.filters.all, count: projects.length },
    {
      key: "ongoing",
      label: dict.filters.ongoing,
      count: projects.filter((p) => p.status === "ongoing").length,
    },
    {
      key: "completed",
      label: dict.filters.completed,
      count: projects.filter((p) => p.status === "completed").length,
    },
  ];

  return (
    <div>
      <div
        role="tablist"
        aria-label={dict.nav.projects}
        className="flex flex-wrap gap-7 border-b border-cream/12"
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={filter === tab.key}
            onClick={() => setFilter(tab.key)}
            className={`-mb-px flex items-center gap-2 border-b-2 pb-3 font-mono text-xs tracking-[0.16em] uppercase transition-colors ${
              filter === tab.key
                ? "border-brass text-brass"
                : "border-transparent text-cream/55 hover:text-cream"
            }`}
          >
            {tab.label}
            <span className="text-[10px] opacity-70">{tab.count}</span>
          </button>
        ))}
      </div>

      <div className="mt-12 grid gap-x-10 gap-y-16 sm:grid-cols-2">
        {filtered.map((project) => (
          <ProjectCard
            key={project.slug}
            lang={lang}
            dict={dict}
            project={project}
          />
        ))}
      </div>
    </div>
  );
}
