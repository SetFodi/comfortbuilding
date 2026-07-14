"use client";

import Image from "next/image";
import { useState } from "react";
import type { GalleryImage } from "./gallery";

interface PlanViewerProps {
  readonly images: readonly GalleryImage[];
}

/** Published architectural floor plates, presented without invented overlays. */
export function PlanViewer({ images }: PlanViewerProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = images[activeIndex];

  return (
    <div className="border border-ink/15 bg-white">
      <div className="flex gap-px overflow-x-auto border-b border-ink/15 bg-ink/15 p-px">
        {images.map((image, index) => (
          <button
            key={image.src}
            type="button"
            aria-pressed={activeIndex === index}
            onClick={() => setActiveIndex(index)}
            className={`min-h-11 shrink-0 px-5 py-3 text-left font-mono text-[11px] tracking-[0.1em] uppercase transition-colors ${
              activeIndex === index
                ? "bg-ink text-cream"
                : "bg-paper text-ink/70 hover:bg-limestone hover:text-ink"
            }`}
          >
            {String(index + 1).padStart(2, "0")} · {image.alt}
          </button>
        ))}
      </div>

      <div className="relative min-h-72 bg-white p-3 sm:p-6 lg:p-10">
        <Image
          key={active.src}
          src={active.src}
          alt={active.alt}
          width={active.width}
          height={active.height}
          sizes="(min-width: 1440px) 1280px, 94vw"
          className="mx-auto h-auto max-h-[75svh] w-auto object-contain"
        />
      </div>

      <p
        aria-live="polite"
        className="border-t border-ink/15 px-5 py-4 font-mono text-xs tracking-[0.08em] text-ink/70"
      >
        {active.alt}
      </p>
    </div>
  );
}
