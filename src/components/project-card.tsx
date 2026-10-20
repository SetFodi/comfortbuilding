import Image from "next/image";
import Link from "next/link";
import type { Dict } from "@/lib/dictionary";
import { projectPeriod } from "@/lib/projects";
import type { Lang, Project } from "@/lib/types";
import { StatusChip } from "./status-chip";

interface ProjectCardProps {
  readonly lang: Lang;
  readonly dict: Dict;
  readonly project: Project;
}

export function ProjectCard({ lang, dict, project }: ProjectCardProps) {
  return (
    <Link href={`/${lang}/projects/${project.slug}`} className="group block">
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={project.cover.src}
          alt={project.cover.alt[lang]}
          fill
          sizes="(min-width: 640px) 45vw, 100vw"
          className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
        />
        <div className="absolute top-4 left-4">
          <StatusChip
            status={project.status}
            label={dict.status[project.status]}
          />
        </div>
      </div>
      <div className="mt-5 flex items-baseline justify-between gap-4">
        <h3 className="font-display text-2xl font-medium text-cream transition-colors group-hover:text-brass">
          {project.name[lang]}
        </h3>
        <span className="shrink-0 font-mono text-xs text-cream/45">
          {projectPeriod(project, dict.misc.tba)}
        </span>
      </div>
      <p className="mt-1.5 text-sm text-cream/55">
        {project.city[lang]}, {project.address[lang]}
      </p>
    </Link>
  );
}
