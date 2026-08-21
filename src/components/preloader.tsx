"use client";

import { useEffect, useState } from "react";
import type { Lang, Localized } from "@/lib/types";

const MIN_DURATION_MS = 1600;
const MAX_WAIT_MS = 3500;
const EXIT_DURATION_MS = 1100;
const LOAD_STALL_PROGRESS = 0.92;

const LOADING_LABEL: Localized = {
  ka: "იტვირთება",
  en: "Loading",
  ru: "Загрузка",
};

type Phase = "loading" | "exiting" | "done";

/**
 * Full-screen entrance: the company's four-tower skyline rises over the
 * blueprint grid while real page load drives the counter; the ink curtain
 * then lifts with a brass sweep and hands off to the hero animation
 * (paused via html[data-preloading] until the curtain goes up).
 */
export function Preloader({ lang }: { readonly lang: Lang }) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const releasePage = () =>
      document.documentElement.removeAttribute("data-preloading");

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      releasePage();
      const reducedMotionFrame = requestAnimationFrame(() => setPhase("done"));
      return () => cancelAnimationFrame(reducedMotionFrame);
    }

    const start = performance.now();
    let frame = 0;
    let exitTimer: ReturnType<typeof setTimeout> | undefined;
    let isLoaded = document.readyState === "complete";
    const onLoad = () => {
      isLoaded = true;
    };
    window.addEventListener("load", onLoad);

    const tick = (now: number) => {
      const elapsed = now - start;
      const byTime = Math.min(elapsed / MIN_DURATION_MS, 1);
      const cap =
        isLoaded || elapsed >= MAX_WAIT_MS ? 1 : LOAD_STALL_PROGRESS;
      const value = Math.min(byTime, cap);
      setProgress(Math.round(value * 100));

      if (value >= 1) {
        setPhase("exiting");
        releasePage();
        exitTimer = setTimeout(() => setPhase("done"), EXIT_DURATION_MS);
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      if (exitTimer) clearTimeout(exitTimer);
      window.removeEventListener("load", onLoad);
      releasePage();
    };
  }, []);

  if (phase === "done") return null;

  const isExiting = phase === "exiting";
  const lift = isExiting ? "-translate-y-full" : "translate-y-0";

  return (
    <div
      className="preloader-root fixed inset-0 z-[160]"
      aria-hidden={isExiting}
      role="status"
      aria-label={LOADING_LABEL[lang]}
    >
      {/* Brass sweep, revealed for a beat as the ink curtain lifts */}
      <div
        aria-hidden
        className={`absolute inset-0 bg-brass transition-transform duration-[1100ms] ease-[cubic-bezier(0.76,0,0.24,1)] ${lift}`}
        style={{ transitionDelay: isExiting ? "90ms" : "0ms" }}
      />

      <div
        className={`draft-grid absolute inset-0 flex flex-col items-center justify-center bg-ink transition-transform duration-[1000ms] ease-[cubic-bezier(0.76,0,0.24,1)] ${lift}`}
      >
        {/* The real skyline: Comfort House 10, Twins 2×15, Grand House 15, Red Line 15 */}
        <div
          aria-hidden
          className="flex h-36 items-end gap-3 border-b border-brass/60 px-2 pb-0"
        >
          <div className="pl-tower h-[72px] w-9 [animation-delay:0.15s]" />
          <div className="flex items-end gap-1.5">
            <div className="pl-tower h-[108px] w-5 [animation-delay:0.3s]" />
            <div className="pl-tower h-[108px] w-5 [animation-delay:0.42s]" />
          </div>
          <div className="pl-tower h-[108px] w-8 [animation-delay:0.56s]" />
          <div className="pl-tower h-[108px] w-7 [animation-delay:0.7s]" />
        </div>

        <p className="pl-fade mt-8 font-mono text-[11px] tracking-[0.42em] text-cream/80 uppercase">
          Comfort Building
        </p>

        <div className="pl-fade mt-6 flex w-56 items-center gap-4">
          <span className="relative h-px flex-1 overflow-hidden bg-cream/15">
            <span
              className="absolute inset-y-0 left-0 bg-brass transition-[width] duration-100 ease-out"
              style={{ width: `${progress}%` }}
            />
          </span>
          <span className="w-9 shrink-0 text-right font-mono text-xs text-brass">
            {progress}%
          </span>
        </div>

        <p
          aria-hidden
          className="pl-fade absolute right-6 bottom-5 font-mono text-6xl leading-none text-cream/[0.07] md:right-10 md:bottom-8 md:text-8xl"
        >
          {String(progress).padStart(3, "0")}
        </p>

        <p className="pl-fade absolute bottom-7 left-6 font-mono text-[10px] tracking-[0.3em] text-cream/40 uppercase md:left-10">
          {LOADING_LABEL[lang]} · ბათუმი — თბილისი
        </p>
      </div>
    </div>
  );
}
