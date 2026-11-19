"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export interface HeroProjectItem {
  readonly slug: string;
  readonly href: string;
  readonly name: string;
  readonly title?: readonly [string, string];
  readonly mobileImage?: string;
  readonly film?: string;
  readonly city: string;
  readonly address: string;
  readonly floors: string;
  readonly status: string;
  readonly image: { readonly src: string; readonly alt: string };
}

interface CoverLabels {
  readonly projects: string;
  readonly heading: string;
  readonly location: string;
  readonly explore: string;
  readonly scroll: string;
  readonly browse: string;
  readonly film: string;
  readonly close: string;
}

const sceneId = (project: HeroProjectItem) => `residence-${project.slug}`;

function ResidenceScene({ projects, index, labels }: {
  readonly projects: readonly HeroProjectItem[];
  readonly index: number;
  readonly labels: CoverLabels;
}) {
  const project = projects[index];
  const next = projects[index + 1];
  const first = index === 0;
  const Heading = first ? "h1" : "h2";
  const scene = useRef<HTMLElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [loadImage, setLoadImage] = useState(first);

  useEffect(() => {
    if (loadImage || !scene.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setLoadImage(true);
        observer.disconnect();
      }
    }, { rootMargin: "100% 0px" });
    observer.observe(scene.current);
    return () => observer.disconnect();
  }, [loadImage]);

  function openFilm() {
    if (!video.current || !project.film || !dialog.current) return;
    video.current.src = project.film;
    dialog.current.showModal();
    void video.current.play().catch(() => { /* Native playback controls stay available. */ });
  }

  return (
    <section ref={scene} id={sceneId(project)} className="cinema-scene" data-drift
      aria-label={project.name} tabIndex={-1}>
      {loadImage && (
        <picture className="cinema-photo">
          {project.mobileImage && <source media="(max-width: 700px)" srcSet={project.mobileImage} />}
          <Image src={project.image.src} alt={project.image.alt} fill sizes="100vw" quality={90}
            loading="eager" fetchPriority={first ? "high" : "low"} />
        </picture>
      )}
      <div className="cinema-shade" aria-hidden />
      <div className="cinema-heading">
        <p>{labels.location}</p>
        <Heading>
          {first && <span className="sr-only">{labels.heading} · </span>}
          <Link href={project.href} aria-label={project.name}>
            {project.title
              ? <><span>{project.title[0]}</span>{" "}<em>{project.title[1]}</em></>
              : project.name}
          </Link>
        </Heading>
      </div>
      <div className="cinema-footer">
        <nav className="scene-index" aria-label={labels.projects}>
          {projects.map((item, i) => (
            <a key={item.slug} href={`#${sceneId(item)}`} aria-label={item.name}
              aria-current={i === index ? "step" : undefined}>
              {String(i + 1).padStart(2, "0")}
            </a>
          ))}
        </nav>
        <Link className="cinema-explore" href={project.href}>{labels.explore}<span aria-hidden>↗</span></Link>
        <div className="cinema-forward">
          {project.film && <button type="button" className="cinema-play" onClick={openFilm}
            aria-label={labels.film} title={labels.film}><span aria-hidden>▶</span></button>}
          <a href={next ? `#${sceneId(next)}` : "#collection"}>
            {next ? labels.scroll : labels.browse}<span aria-hidden>↓</span>
          </a>
        </div>
      </div>
      {project.film && (
        <dialog ref={dialog} className="project-film-dialog" aria-label={labels.film}
          onClose={() => video.current?.pause()}
          onClick={(event) => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
          <div className="film-screen">
            <div><span>{project.name}</span><button type="button" onClick={() => dialog.current?.close()} aria-label={labels.close}>×</button></div>
            <video ref={video} controls playsInline muted preload="none" aria-label={project.name} />
          </div>
        </dialog>
      )}
    </section>
  );
}

export function HeroProjectCarousel({ projects, labels }: {
  readonly projects: readonly HeroProjectItem[];
  readonly labels: CoverLabels;
}) {
  if (!projects.length) return null;
  return (
    <div className="cinema-cover" id="featured-residences">
      {projects.map((project, index) => <ResidenceScene key={project.slug} projects={projects} index={index} labels={labels} />)}
    </div>
  );
}
