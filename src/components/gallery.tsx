"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

export interface GalleryImage {
  readonly src: string;
  readonly width: number;
  readonly height: number;
  readonly alt: string;
}

export interface GalleryLabels {
  readonly previous: string;
  readonly next: string;
  readonly close: string;
}

interface GalleryProps {
  readonly images: readonly GalleryImage[];
  readonly labels?: GalleryLabels;
}

const DEFAULT_LABELS: GalleryLabels = {
  previous: "Previous",
  next: "Next",
  close: "Close",
};

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

/** Masonry photo grid with a keyboard-navigable lightbox. */
export function Gallery({ images, labels = DEFAULT_LABELS }: GalleryProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const isOpen = openIndex !== null;

  const close = useCallback(() => setOpenIndex(null), []);

  const step = useCallback(
    (direction: 1 | -1) => {
      setOpenIndex((current) =>
        current === null
          ? current
          : (current + direction + images.length) % images.length,
      );
    },
    [images.length],
  );

  useEffect(() => {
    if (!isOpen) return;

    const dialog = dialogRef.current;
    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousBodyOverflow = document.body.style.overflow;
    const focusFrame = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        step(1);
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        step(-1);
        return;
      }
      if (event.key !== "Tab" || !dialog) return;

      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((element) => element.getAttribute("aria-hidden") !== "true");

      if (focusable.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || !dialog.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousBodyOverflow;
      window.removeEventListener("keydown", onKeyDown);
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, [isOpen, close, step]);

  return (
    <>
      <div className="columns-1 gap-4 space-y-4 min-[440px]:columns-2 lg:columns-3">
        {images.map((image, index) => (
          <button
            key={image.src + index}
            type="button"
            onClick={() => setOpenIndex(index)}
            className="group block w-full cursor-zoom-in overflow-hidden"
            aria-label={image.alt}
          >
            <Image
              src={image.src}
              alt={image.alt}
              width={image.width}
              height={image.height}
              sizes="(min-width: 1024px) 30vw, (min-width: 440px) 45vw, 100vw"
              className="h-auto w-full transition-transform duration-700 group-hover:scale-[1.03]"
            />
          </button>
        ))}
      </div>

      {openIndex !== null && (
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={images[openIndex].alt}
          tabIndex={-1}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/95 p-4 md:p-10"
          onClick={close}
        >
          <div
            className="relative max-h-full"
            onClick={(event) => event.stopPropagation()}
          >
            <Image
              src={images[openIndex].src}
              alt={images[openIndex].alt}
              width={images[openIndex].width}
              height={images[openIndex].height}
              sizes="90vw"
              className="max-h-[82svh] w-auto object-contain"
            />
            <div className="mt-4 flex items-center justify-between gap-4">
              <p className="min-w-0 truncate text-sm text-cream/70">
                {images[openIndex].alt}
              </p>
              <p className="shrink-0 font-mono text-xs text-cream/50">
                {openIndex + 1} / {images.length}
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label={labels.previous}
            onClick={(event) => {
              event.stopPropagation();
              step(-1);
            }}
            className="absolute top-1/2 left-3 flex size-11 -translate-y-1/2 items-center justify-center border border-cream/25 bg-ink/60 text-cream transition-colors hover:border-brass hover:text-brass md:left-8"
          >
            ←
          </button>
          <button
            type="button"
            aria-label={labels.next}
            onClick={(event) => {
              event.stopPropagation();
              step(1);
            }}
            className="absolute top-1/2 right-3 flex size-11 -translate-y-1/2 items-center justify-center border border-cream/25 bg-ink/60 text-cream transition-colors hover:border-brass hover:text-brass md:right-8"
          >
            →
          </button>
          <button
            ref={closeButtonRef}
            type="button"
            aria-label={labels.close}
            onClick={(event) => {
              event.stopPropagation();
              close();
            }}
            className="absolute top-5 right-5 flex size-11 items-center justify-center border border-cream/25 bg-ink/60 text-cream transition-colors hover:border-brass hover:text-brass"
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}
