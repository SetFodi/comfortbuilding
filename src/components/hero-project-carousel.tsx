"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useReducer,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";

const AUTOPLAY_MS = 5600;
const SWIPE_THRESHOLD_PX = 48;

export interface HeroProjectItem {
  readonly slug: string;
  readonly href: string;
  readonly name: string;
  readonly city: string;
  readonly address: string;
  readonly status: string;
  readonly floors: string;
  readonly image: {
    readonly src: string;
    readonly alt: string;
  };
}

interface HeroProjectCarouselProps {
  readonly projects: readonly HeroProjectItem[];
  readonly labels: {
    readonly projects: string;
    readonly previous: string;
    readonly next: string;
  };
}

function wrapIndex(index: number, length: number) {
  return (index + length) % length;
}

interface CarouselLoadingState {
  readonly activeIndex: number;
  readonly requestedIndex: number;
  readonly mountedIndices: readonly number[];
  readonly readyIndices: readonly number[];
}

type CarouselLoadingAction =
  | { readonly type: "move"; readonly step: number; readonly length: number }
  | { readonly type: "stage"; readonly index: number }
  | { readonly type: "ready"; readonly index: number }
  | { readonly type: "failed"; readonly index: number };

function carouselLoadingReducer(
  state: CarouselLoadingState,
  action: CarouselLoadingAction,
): CarouselLoadingState {
  if (action.type === "move") {
    if (action.length < 2) return state;
    const requestedIndex = wrapIndex(
      state.requestedIndex + action.step,
      action.length,
    );

    return {
      ...state,
      requestedIndex,
      activeIndex: state.readyIndices.includes(requestedIndex)
        ? requestedIndex
        : state.activeIndex,
      mountedIndices: state.mountedIndices.includes(requestedIndex)
        ? state.mountedIndices
        : [...state.mountedIndices, requestedIndex],
    };
  }

  if (action.type === "stage") {
    return state.mountedIndices.includes(action.index)
      ? state
      : { ...state, mountedIndices: [...state.mountedIndices, action.index] };
  }

  if (action.type === "ready") {
    return {
      ...state,
      activeIndex:
        action.index === state.requestedIndex ? action.index : state.activeIndex,
      readyIndices: state.readyIndices.includes(action.index)
        ? state.readyIndices
        : [...state.readyIndices, action.index],
    };
  }

  // Keep the last good photograph visible. A later navigation can retry the
  // failed image rather than switching to a blank slide.
  return {
    ...state,
    requestedIndex:
      action.index === state.requestedIndex
        ? state.activeIndex
        : state.requestedIndex,
    mountedIndices:
      action.index === state.activeIndex
        ? state.mountedIndices
        : state.mountedIndices.filter((index) => index !== action.index),
  };
}

/** A looping, swipeable project stage with a quiet architectural crossfade. */
export function HeroProjectCarousel({
  projects,
  labels,
}: HeroProjectCarouselProps) {
  const [loading, dispatchLoading] = useReducer(carouselLoadingReducer, {
    activeIndex: 0,
    requestedIndex: 0,
    mountedIndices: [0],
    readyIndices: [],
  });
  const [isPaused, setIsPaused] = useState(false);
  const pointerStartX = useRef<number | null>(null);
  const didSwipe = useRef(false);
  const activeIndex = loading.activeIndex;
  const activeReady = loading.readyIndices.includes(activeIndex);
  const isPending = loading.requestedIndex !== activeIndex;

  useEffect(() => {
    if (!activeReady || projects.length < 2) return;
    dispatchLoading({
      type: "stage",
      index: wrapIndex(activeIndex + 1, projects.length),
    });
  }, [activeIndex, activeReady, projects.length]);

  useEffect(() => {
    if (isPaused || isPending || !activeReady || projects.length < 2) return;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timer = 0;

    const schedule = () => {
      window.clearTimeout(timer);
      if (motionQuery.matches || document.hidden) return;
      timer = window.setTimeout(() => {
        dispatchLoading({ type: "move", step: 1, length: projects.length });
      }, AUTOPLAY_MS);
    };

    schedule();
    motionQuery.addEventListener("change", schedule);
    document.addEventListener("visibilitychange", schedule);

    return () => {
      window.clearTimeout(timer);
      motionQuery.removeEventListener("change", schedule);
      document.removeEventListener("visibilitychange", schedule);
    };
  }, [activeIndex, activeReady, isPaused, isPending, projects.length]);

  if (projects.length === 0) return null;

  const move = (step: number) => {
    dispatchLoading({ type: "move", step, length: projects.length });
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    pointerStartX.current = event.clientX;
    didSwipe.current = false;
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerStartX.current === null) return;
    const distance = event.clientX - pointerStartX.current;
    pointerStartX.current = null;

    if (Math.abs(distance) < SWIPE_THRESHOLD_PX) return;
    didSwipe.current = true;
    move(distance < 0 ? 1 : -1);
    window.setTimeout(() => {
      didSwipe.current = false;
    }, 0);
  };

  return (
    <div
      role="region"
      aria-label={labels.projects}
      aria-roledescription="carousel"
      aria-busy={isPending}
      data-paused={isPaused || isPending || !activeReady}
      className="group hero-aperture relative h-[52svh] min-h-[30rem] touch-pan-y overflow-hidden rounded-[2rem] bg-basalt lg:h-[72svh] lg:min-h-[36rem]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={(event) => {
        if (
          !event.currentTarget.contains(event.relatedTarget as Node | null)
        ) {
          setIsPaused(false);
        }
      }}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        pointerStartX.current = null;
      }}
    >
      {projects.map((project, index) => {
        const isActive = index === activeIndex;

        return (
          <div
            key={project.slug}
            role="group"
            aria-roledescription="slide"
            aria-label={`${String(index + 1).padStart(2, "0")} / ${String(projects.length).padStart(2, "0")} · ${project.name}`}
            aria-hidden={!isActive}
            className={`absolute inset-0 transition-[opacity,transform,filter] duration-[1100ms] ease-[cubic-bezier(.2,.65,.25,1)] motion-reduce:transition-none ${
              isActive
                ? "z-10 scale-100 opacity-100 blur-0"
                : "pointer-events-none z-0 scale-[1.035] opacity-0 blur-[2px]"
            }`}
          >
            <Link
              href={project.href}
              tabIndex={isActive ? undefined : -1}
              onClick={(event) => {
                if (!didSwipe.current) return;
                event.preventDefault();
                didSwipe.current = false;
              }}
              className="absolute inset-0 block"
            >
              {loading.mountedIndices.includes(index) && (
                <Image
                  src={project.image.src}
                  alt={project.image.alt}
                  fill
                  sizes="(min-width: 1440px) 520px, (min-width: 1024px) 42vw, 100vw"
                  quality={90}
                  preload={index === 0}
                  loading={index === 0 ? undefined : "eager"}
                  onLoad={() => {
                    // Next Image calls onLoad after its decode promise settles.
                    dispatchLoading({ type: "ready", index });
                  }}
                  onError={() => dispatchLoading({ type: "failed", index })}
                  className="hero-carousel-image object-cover transition-transform duration-[5600ms] ease-out group-hover:scale-[1.035] motion-reduce:transition-none"
                />
              )}
              <span
                aria-hidden
                className="absolute inset-0 bg-[linear-gradient(to_top,rgba(11,13,15,.9)_0%,rgba(11,13,15,.2)_44%,rgba(11,13,15,.12)_100%)]"
              />

              <span className="absolute right-6 bottom-7 left-6 flex items-end justify-between gap-5 md:right-8 md:bottom-8 md:left-8">
                <span className="min-w-0 max-w-[82%]">
                  <span className="block font-mono text-[10px] tracking-[0.2em] text-brass uppercase">
                    {project.status}
                  </span>
                  <span className="mt-1 block font-display text-2xl leading-tight text-cream md:text-3xl">
                    {project.name}
                  </span>
                  <span className="mt-2 hidden truncate text-xs text-cream/60 sm:block">
                    {project.city} · {project.address}
                  </span>
                </span>
                <span
                  aria-hidden
                  className="grid size-11 shrink-0 place-items-center rounded-full border border-cream/30 text-xl text-cream transition-colors group-hover:border-brass group-hover:bg-brass group-hover:text-ink"
                >
                  →
                </span>
              </span>
            </Link>
          </div>
        );
      })}

      <div className="pointer-events-none absolute top-6 right-6 left-6 z-20 flex items-center justify-between md:top-8 md:right-8 md:left-8">
        <div className="rounded-full border border-cream/20 bg-ink/35 px-4 py-2 font-mono text-[11px] tracking-[0.16em] text-cream backdrop-blur-md">
          <span className="text-brass">
            {String(activeIndex + 1).padStart(2, "0")}
          </span>
          <span className="mx-2 text-cream/35">/</span>
          {String(projects.length).padStart(2, "0")}
        </div>

        <div className="pointer-events-auto flex gap-2">
          <button
            type="button"
            onClick={() => move(-1)}
            className="grid size-11 place-items-center rounded-full border border-cream/25 bg-ink/35 text-lg text-cream backdrop-blur-md transition-colors hover:border-brass hover:bg-brass hover:text-ink"
            aria-label={labels.previous}
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => move(1)}
            className="grid size-11 place-items-center rounded-full border border-cream/25 bg-ink/35 text-lg text-cream backdrop-blur-md transition-colors hover:border-brass hover:bg-brass hover:text-ink"
            aria-label={labels.next}
          >
            →
          </button>
        </div>
      </div>

      <div
        aria-hidden
        className="absolute right-0 bottom-0 left-0 z-20 h-[3px] bg-cream/10"
      >
        <span
          key={`${activeIndex}-${isPaused}`}
          className="hero-carousel-progress block h-full origin-left bg-brass"
          style={{ "--carousel-duration": `${AUTOPLAY_MS}ms` } as CSSProperties}
        />
      </div>
    </div>
  );
}
