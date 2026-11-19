"use client";

import { useEffect, useRef, useState } from "react";
import type { SiteVideo } from "@/lib/types";

/** Same breakpoint as the hero's desktop <source>; phones keep the still. */
const DESKTOP_QUERY = "(min-width: 768px)";

/**
 * Plays a silent clip once over the hero image, then holds its last frame.
 * The image underneath is the poster, so the clip only fades in once it is
 * actually playing. It starts after the hero's entrance zoom has finished,
 * which is also held while the site loader covers the page. Phones, reduced
 * motion and data-saver connections never download it.
 */
export function HeroVideo({ video }: { readonly video: SiteVideo }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (
      !window.matchMedia(DESKTOP_QUERY).matches ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      connection?.saveData
    ) {
      return;
    }

    let cancelled = false;
    // Buffer during the entrance so playback can start the moment it ends.
    element.preload = "auto";
    element.src = video.src;

    const media = element.parentElement;
    const entrance =
      media && typeof media.getAnimations === "function"
        ? Promise.all(media.getAnimations().map((animation) => animation.finished))
        : Promise.resolve();

    entrance
      .then(() => {
        if (!cancelled) return element.play();
      })
      .catch(() => {
        // Autoplay refused or the entrance was cancelled: the still stays.
      });

    return () => {
      cancelled = true;
      element.pause();
    };
  }, [video.src]);

  return (
    <video
      ref={ref}
      muted
      playsInline
      preload="none"
      disablePictureInPicture
      aria-hidden
      tabIndex={-1}
      width={video.width}
      height={video.height}
      onPlaying={() => setPlaying(true)}
      className={`pointer-events-none absolute inset-0 hidden h-full w-full object-cover object-center transition-opacity duration-700 ease-out md:block motion-reduce:hidden ${playing ? "opacity-100" : "opacity-0"}`}
    />
  );
}
