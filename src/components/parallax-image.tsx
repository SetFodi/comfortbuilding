"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

const PARALLAX_RANGE_PERCENT = 6;

interface ParallaxImageProps {
  readonly src: string;
  readonly alt: string;
  readonly sizes: string;
  readonly priority?: boolean;
}

/** Fills its (positioned, overflow-hidden) parent and drifts on scroll. */
export function ParallaxImage({
  src,
  alt,
  sizes,
  priority = false,
}: ParallaxImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;

    const update = () => {
      frame = 0;
      const container = containerRef.current;
      const image = imageRef.current;
      if (!container || !image) return;
      const rect = container.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const progress = Math.max(
        -1,
        Math.min(
          1,
          (rect.top + rect.height / 2 - viewportHeight / 2) / viewportHeight,
        ),
      );
      image.style.transform = `translateY(${-progress * PARALLAX_RANGE_PERCENT}%) scale(1.12)`;
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0">
      <Image
        ref={imageRef}
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        className="scale-[1.12] object-cover"
      />
    </div>
  );
}
