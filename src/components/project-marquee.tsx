import Link from "next/link";
import type { CSSProperties } from "react";
import type { HeroProjectItem } from "./hero-project-carousel";

interface ProjectMarqueeProps {
  readonly projects: readonly HeroProjectItem[];
  readonly labels: {
    readonly region: string;
    readonly project: string;
    readonly location: string;
    readonly status: string;
    readonly floors: string;
  };
}

interface MarqueeCopyProps extends ProjectMarqueeProps {
  readonly duplicate?: boolean;
}

function MarqueeCopy({
  projects,
  labels,
  duplicate = false,
}: MarqueeCopyProps) {
  return (
    <div
      role={duplicate ? undefined : "list"}
      aria-hidden={duplicate || undefined}
      className={`hero-marquee-copy flex shrink-0 ${duplicate ? "hero-marquee-copy--duplicate" : ""}`}
    >
      {projects.map((project, index) => (
        <div
          key={`${duplicate ? "duplicate-" : ""}${project.slug}`}
          role={duplicate ? undefined : "listitem"}
          className="flex shrink-0 border-r border-cream/15"
        >
          <div className="relative w-72 shrink-0 border-l border-cream/15 px-6 py-5">
            <span className="font-mono text-[10px] tracking-[0.22em] text-cream/45 uppercase">
              {labels.project}
            </span>
            <Link
              href={project.href}
              tabIndex={duplicate ? -1 : undefined}
              className="link-slide mt-2 block w-fit max-w-full truncate font-display text-lg text-brass"
            >
              {project.name}
            </Link>
            <span
              aria-hidden
              className="absolute top-5 right-5 font-mono text-[10px] text-cream/25"
            >
              {String(index + 1).padStart(2, "0")}
            </span>
          </div>

          <div className="w-[24rem] shrink-0 border-l border-cream/15 px-6 py-5">
            <span className="font-mono text-[10px] tracking-[0.22em] text-cream/45 uppercase">
              {labels.location}
            </span>
            <span className="mt-2 block truncate text-sm text-cream/85">
              {project.city}, {project.address}
            </span>
          </div>

          <div className="w-44 shrink-0 border-l border-cream/15 px-6 py-5">
            <span className="font-mono text-[10px] tracking-[0.22em] text-cream/45 uppercase">
              {labels.status}
            </span>
            <span className="mt-2 block text-sm text-cream/85">
              {project.status}
            </span>
          </div>

          <div className="w-32 shrink-0 border-l border-cream/15 px-6 py-5">
            <span className="font-mono text-[10px] tracking-[0.22em] text-cream/45 uppercase">
              {labels.floors}
            </span>
            <span className="mt-2 block font-mono text-sm text-cream/85">
              {project.floors}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

/** A continuous drawing-title-block index of every published project. */
export function ProjectMarquee({ projects, labels }: ProjectMarqueeProps) {
  const durationSeconds = Math.max(54, projects.length * 12);

  return (
    <div
      role="region"
      aria-label={labels.region}
      className="hero-marquee relative overflow-hidden border-y border-cream/12 bg-ink"
      style={
        {
          "--marquee-duration": `${durationSeconds}s`,
        } as CSSProperties
      }
    >
      <div className="hero-marquee-track flex w-max">
        <MarqueeCopy projects={projects} labels={labels} />
        <MarqueeCopy projects={projects} labels={labels} duplicate />
      </div>
    </div>
  );
}
