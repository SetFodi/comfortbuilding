import Link from "next/link";
import type { Lang, ProjectStatus } from "@/lib/types";
import { ProjectMedia } from "./project-media";

export interface ProjectRegisterItem {
  readonly slug: string;
  readonly name: string;
  readonly city: string;
  readonly address: string;
  readonly floors: string;
  readonly startYear: number;
  readonly endYear: number;
  readonly status: ProjectStatus;
  readonly cover: { readonly src: string; readonly alt: string };
}

interface ProjectRegisterProps {
  readonly lang: Lang;
  readonly projects: readonly ProjectRegisterItem[];
  readonly labels: {
    readonly floors: string;
    readonly ongoing: string;
    readonly completed: string;
  };
}

const EXPAND_EASE = "ease-[cubic-bezier(0.25,0.46,0.45,0.94)]";

/**
 * The project register: an index of every building the company has built.
 * Hovering (or focusing) a row slides the title, inverts the floors pill and
 * unfolds a full-width photograph of the building beneath the row.
 */
export function ProjectRegister({
  lang,
  projects,
  labels,
}: ProjectRegisterProps) {
  return (
    <div className="flex flex-col border-t border-cream/12">
      {projects.map((project, index) => {
        const statusLabel =
          project.status === "ongoing" ? labels.ongoing : labels.completed;

        return (
          <Link
            key={project.slug}
            href={`/${lang}/projects/${project.slug}`}
            className="group relative flex flex-col border-b border-cream/12 py-7 transition-colors duration-500 hover:border-cream/30 md:py-9"
          >
            <span
              aria-hidden
              className={`absolute inset-0 -z-10 origin-bottom scale-y-0 bg-cream/[0.05] transition-transform duration-700 ${EXPAND_EASE} group-hover:scale-y-100 group-focus-visible:scale-y-100`}
            />

            <span className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between md:gap-8 md:px-4">
              <span className="flex min-w-0 items-center gap-5">
                <span className="relative block h-16 w-24 shrink-0 overflow-hidden rounded-xl lg:hidden">
                  <ProjectMedia
                    src={project.cover.src}
                    alt=""
                    sizes="96px"
                    className="h-full w-full"
                    foregroundClassName="p-1"
                  />
                </span>

                <span className="min-w-0">
                  <span className="block font-mono text-xs text-cream/60">
                    {String(index + 1).padStart(2, "0")} · {project.startYear}–
                    {project.endYear}
                  </span>
                  <span className="mt-1 block truncate font-display text-3xl leading-tight font-medium text-cream transition-[translate,color] duration-700 ease-out group-hover:translate-x-3 group-hover:text-brass md:text-5xl">
                    {project.name}
                  </span>
                </span>
              </span>

              <span className="flex items-center justify-between gap-4 transition-transform duration-700 ease-out md:justify-end md:gap-10 md:group-hover:-translate-x-3">
                <span className="text-sm text-cream/60 transition-colors duration-500 group-hover:text-cream md:text-base">
                  {project.city} · {statusLabel}
                </span>
                <span className="shrink-0 rounded-full border border-cream/20 px-4 py-2 font-mono text-xs text-cream transition-colors duration-500 group-hover:border-brass group-hover:bg-brass group-hover:text-ink md:text-sm">
                  {project.floors} {labels.floors.toLowerCase()}
                </span>
              </span>
            </span>

            <span
              aria-hidden
              className={`hidden grid-rows-[0fr] transition-[grid-template-rows,margin-top] duration-700 ${EXPAND_EASE} group-hover:mt-9 group-hover:grid-rows-[1fr] group-focus-visible:mt-9 group-focus-visible:grid-rows-[1fr] md:px-4 lg:grid`}
            >
              <span className="block min-h-0 overflow-hidden">
                <span className="relative block w-full overflow-hidden rounded-[2rem] bg-basalt">
                  <ProjectMedia
                    src={project.cover.src}
                    alt=""
                    sizes="(min-width: 1440px) 1328px, (min-width: 1024px) 92vw, 0px"
                    className="aspect-[21/9] w-full"
                    foregroundClassName="p-4 md:p-8"
                  />
                  <span
                    aria-hidden
                    className="absolute inset-0 bg-ink/10 transition-colors duration-700 group-hover:bg-transparent"
                  />
                  <span
                    aria-hidden
                    className="absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(to_top,rgba(11,13,15,.82),transparent)]"
                  />
                  <span className="absolute bottom-5 left-6 font-mono text-[11px] tracking-[0.18em] text-cream/90 uppercase">
                    {project.address} · {project.city}
                  </span>
                </span>
              </span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}
