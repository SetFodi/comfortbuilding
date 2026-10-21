"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { Lang, Localized } from "@/lib/types";

/** When the curtain starts lifting, in ms from first paint (matches `.site-loader`). */
const LIFT_AT_MS = 2900;

const LOADING_LABEL: Localized = {
  ka: "იტვირთება",
  en: "Loading",
  ru: "Загрузка",
};

// Client-side navigations remount the locale layout; only a real page
// load (open or refresh) plays the scene.
let played = false;

/**
 * Site entrance: blocks drop onto the ground line while the crane swings in
 * the Comfort Building medallion and sets it on the tower like signage.
 * The curtain lifts on its own in CSS, so the page underneath stays in the
 * HTML for search visitors and never waits on JavaScript to appear.
 */
export function SiteLoader({ lang }: { readonly lang: Lang }) {
  const [shown, setShown] = useState(() => !played);
  const [holding, setHolding] = useState(shown);

  useEffect(() => {
    played = true;
    if (!shown) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // performance.now() counts from navigation start, so a late hydration
    // releases the hero as soon as it can.
    const timer = setTimeout(() => setHolding(false), reduced ? 0 : Math.max(0, LIFT_AT_MS - performance.now()));
    return () => clearTimeout(timer);
  }, [shown]);

  if (!shown) return null;

  return (
    <div
      className="site-loader fixed inset-0 z-[200] flex flex-col items-center justify-center gap-7 overflow-hidden bg-[#121412] px-6"
      data-site-loader={holding ? "holding" : "lifting"}
      aria-hidden
      onAnimationEnd={(event) => {
        if (event.target === event.currentTarget) setShown(false);
      }}
    >
      <div className="ml-noise pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-overlay" />
      <div className="ml-scene relative h-[220px] w-[340px] shrink-0">
        <div className="absolute bottom-0 -left-[30px] z-10 h-[3px] w-[400px] rounded-full bg-brass" />

        <div className="ml-block absolute bottom-[3px] left-[50px] z-20 flex h-[100px] w-[60px] flex-col justify-end gap-2 border-2 border-brass bg-iron p-2 [--ml-delay:0.4s]">
          <div className="h-8 w-full border-2 border-brass bg-ink" />
          <div className="h-8 w-full border-2 border-brass bg-ink" />
        </div>
        <div className="ml-block absolute bottom-[3px] left-[110px] z-10 flex h-[70px] w-[50px] flex-col items-center justify-end border-2 border-cream bg-brass pb-3 [--ml-delay:0.5s]">
          <div className="size-8 border-2 border-ink bg-cream" />
        </div>
        <div className="ml-block absolute bottom-[3px] left-[160px] z-10 flex h-[50px] w-[60px] items-center justify-center gap-2 border-2 border-brass bg-cream px-1 [--ml-delay:0.6s]">
          <div className="h-8 w-6 border-2 border-ink bg-brass" />
          <div className="h-8 w-6 border-2 border-ink bg-brass" />
        </div>

        {/* Crane mast and cabin */}
        <div className="absolute right-[40px] bottom-[3px] flex h-[160px] w-[20px] flex-col justify-evenly border-2 border-brass bg-ink p-[2px]">
          {Array.from({ length: 12 }, (_, index) => <div key={index} className="-ml-1 h-[2px] w-[20px] rotate-45 bg-brass" />)}
        </div>
        <div className="ml-cabin absolute top-[30px] right-[48px] z-20 h-4 w-5 border-2 border-cream bg-brass" />

        {/* Jib, cable and the medallion it carries */}
        <div className="ml-jib absolute top-4 right-[40px] z-30 h-[100px] w-[140px]">
          <div className="absolute top-0 right-0 flex h-3 w-[140px] items-center justify-center overflow-hidden border-2 border-brass bg-ink">
            {Array.from({ length: 10 }, (_, index) => <div key={index} className="ml-1 h-[2px] w-[10px] shrink-0 rotate-45 bg-brass" />)}
          </div>
          <div className="ml-cable absolute top-[10px] left-[30px] w-[2px]">
            <div className="ml-medal absolute top-full -left-[19px] flex size-10 items-center justify-center rounded-full border-2 border-brass bg-ink">
              <Image src="/images/logo-mark.png" alt="" width={28} height={28} loading="eager" fetchPriority="high" />
            </div>
          </div>
        </div>

        {/* Tractor */}
        <div className="ml-tractor absolute right-[100px] bottom-[3px] z-40 h-6 w-[50px]">
          <div className="absolute bottom-[6px] left-[6px] h-3 w-9 rounded-tl-sm border-2 border-cream bg-brass" />
          <div className="absolute bottom-4 left-[26px] size-4 rounded-t-sm border-2 border-brass bg-cream" />
          <div className="absolute bottom-0 left-[2px] size-[14px] rounded-full border-2 border-brass bg-ink" />
          <div className="absolute bottom-0 left-[26px] size-[18px] rounded-full border-2 border-brass bg-ink" />
          <div className="absolute bottom-2 -left-4 h-1 w-6 origin-right rotate-[30deg] bg-brass">
            <div className="absolute -top-[6px] -left-1 size-[10px] border-2 border-brass bg-cream" />
          </div>
        </div>
      </div>

      <div className="ml-caption relative flex items-center gap-3">
        <span className="size-2 animate-pulse rounded-full bg-brass" />
        <span className="font-mono text-[10px] tracking-[0.3em] text-brass uppercase">
          Comfort Building · {LOADING_LABEL[lang]}
        </span>
      </div>
    </div>
  );
}
