"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { PriceContact } from "@/components/price-contact";
import type { Lang } from "@/lib/types";

export interface ApartmentLayoutItem {
  readonly id: string;
  /** Area already formatted for the language, without the unit. */
  readonly area: string;
  readonly bedrooms: number;
  /** Starting price per m² and how many apartments of this size are for sale. */
  readonly price?: { readonly from: string; readonly forSale: number };
  readonly image: {
    readonly src: string;
    readonly width: number;
    readonly height: number;
    readonly alt: string;
  };
}

interface ApartmentLayoutsProps {
  readonly lang: Lang;
  readonly projectSlug: string;
  readonly projectName: string;
  readonly layouts: readonly ApartmentLayoutItem[];
}

const COPY = {
  ka: {
    type: "ტიპი",
    unit: "მ²",
    view: "გეგმის ნახვა",
    previous: "წინა",
    next: "შემდეგი",
    close: "დახურვა",
    from: (price: string) => `${price}-დან / მ²`,
    forSale: (count: number) => `${count} იყიდება`,
    seePrices: "ფასების ნახვა",
    bedrooms: (count: number) => `${count} საძინებელი`,
  },
  en: {
    type: "Type",
    unit: "m²",
    view: "View layout",
    previous: "Previous",
    next: "Next",
    close: "Close",
    from: (price: string) => `from ${price} / m²`,
    forSale: (count: number) => `${count} for sale`,
    seePrices: "See prices",
    bedrooms: (count: number) => `${count} bedroom${count === 1 ? "" : "s"}`,
  },
  ru: {
    type: "Тип",
    unit: "м²",
    view: "Смотреть планировку",
    previous: "Назад",
    next: "Далее",
    close: "Закрыть",
    from: (price: string) => `от ${price} / м²`,
    forSale: (count: number) => `${count} в продаже`,
    seePrices: "Смотреть цены",
    bedrooms: (count: number) =>
      `${count} ${count === 1 ? "спальня" : count < 5 ? "спальни" : "спален"}`,
  },
} as const;

/** Board backgrounds, so contained images sit flush in their frames. */
const BOARD_BACKGROUND = "bg-[#f2efea]";

export function ApartmentLayouts({
  lang,
  projectSlug,
  projectName,
  layouts,
}: ApartmentLayoutsProps) {
  const copy = COPY[lang];
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const active = openIndex === null ? null : layouts[openIndex];

  const step = useCallback(
    (direction: 1 | -1) =>
      setOpenIndex((current) =>
        current === null
          ? current
          : (current + direction + layouts.length) % layouts.length,
      ),
    [layouts.length],
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (openIndex !== null && !dialog.open) dialog.showModal();
    if (openIndex === null && dialog.open) dialog.close();
  }, [openIndex]);

  useEffect(() => {
    if (openIndex === null) return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previous;
    };
  }, [openIndex]);

  const typeLabel = (index: number) =>
    `${copy.type} ${String(index + 1).padStart(2, "0")}`;

  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {layouts.map((layout, index) => (
          <article
            key={layout.id}
            id={`layout-${layout.id}`}
            className="group flex flex-col border border-ink/15 bg-white transition-colors hover:border-bronze/40"
          >
            <button
              type="button"
              onClick={() => setOpenIndex(index)}
              aria-label={`${copy.view}: ${layout.area} ${copy.unit}`}
              className={`relative block aspect-[5/4] overflow-hidden border-b border-ink/15 ${BOARD_BACKGROUND}`}
            >
              <Image
                src={layout.image.src}
                alt={layout.image.alt}
                fill
                sizes="(min-width: 1280px) 30vw, (min-width: 640px) 46vw, 100vw"
                className="object-contain p-3 transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none"
              />
              <span className="absolute right-3 bottom-3 bg-ink px-3 py-2 font-mono text-[9px] tracking-[0.12em] text-cream uppercase transition-colors group-hover:bg-bronze">
                {copy.view} <span aria-hidden>↗</span>
              </span>
            </button>

            <div className="flex flex-1 flex-col p-6 md:p-7">
              <p className="font-mono text-[10px] tracking-[0.14em] text-ink/50 uppercase">
                {typeLabel(index)} · {copy.bedrooms(layout.bedrooms)}
              </p>
              <h3 className="mt-3 font-display text-4xl leading-none text-ink">
                {layout.area}{" "}
                <span className="text-2xl text-ink/60">{copy.unit}</span>
              </h3>
              {layout.price ? (
                <div className="mt-6 border-t border-ink/12 pt-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <p className="font-mono text-lg text-bronze">
                      {copy.from(layout.price.from)}
                    </p>
                    <a
                      href="#prices"
                      className="link-slide font-mono text-[10px] tracking-[0.14em] text-ink/55 uppercase hover:text-bronze"
                    >
                      {copy.forSale(layout.price.forSale)} · {copy.seePrices}{" "}
                      <span aria-hidden>↓</span>
                    </a>
                  </div>
                  <PriceContact
                    lang={lang}
                    projectSlug={projectSlug}
                    projectName={projectName}
                    placement="layout-card"
                    topic={`${layout.area} ${copy.unit}`}
                    tone="light"
                    variant="buttons"
                    className="mt-4"
                  />
                </div>
              ) : (
                <PriceContact
                  lang={lang}
                  projectSlug={projectSlug}
                  projectName={projectName}
                  placement="layout-card"
                  topic={`${layout.area} ${copy.unit}`}
                  tone="light"
                  className="mt-6 border-t border-ink/12 pt-5"
                />
              )}
            </div>
          </article>
        ))}
      </div>

      <dialog
        ref={dialogRef}
        aria-label={active ? `${active.area} ${copy.unit}` : undefined}
        onClose={() => setOpenIndex(null)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setOpenIndex(null);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") step(1);
          if (event.key === "ArrowLeft") step(-1);
        }}
        className="m-auto max-h-[94svh] w-[min(72rem,94vw)] overflow-hidden border border-ink/15 bg-paper p-0 text-ink backdrop:bg-ink/85 backdrop:backdrop-blur-sm"
      >
        {active && openIndex !== null && (
          <div className="flex max-h-[94svh] flex-col">
            <div className="flex items-center justify-between gap-4 border-b border-ink/15 px-5 py-3 md:px-6">
              <p className="font-mono text-[10px] tracking-[0.14em] text-ink/60 uppercase">
                {typeLabel(openIndex)} · {active.area} {copy.unit} ·{" "}
                {copy.bedrooms(active.bedrooms)}
              </p>
              <button
                type="button"
                onClick={() => setOpenIndex(null)}
                className="inline-flex min-h-11 items-center px-2 text-sm font-semibold text-ink/70 hover:text-bronze"
              >
                {copy.close} <span aria-hidden className="ml-2">✕</span>
              </button>
            </div>

            <div className={`relative min-h-0 flex-1 ${BOARD_BACKGROUND}`}>
              <Image
                key={active.image.src}
                src={active.image.src}
                alt={active.image.alt}
                width={active.image.width}
                height={active.image.height}
                sizes="(min-width: 1152px) 72rem, 94vw"
                quality={90}
                className="mx-auto h-auto max-h-[calc(94svh-8rem)] w-auto max-w-full object-contain"
              />
            </div>

            <div className="flex items-center justify-between gap-4 border-t border-ink/15 px-5 py-2 md:px-6">
              <button
                type="button"
                onClick={() => step(-1)}
                className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-ink/70 hover:text-bronze"
              >
                <span aria-hidden>←</span> {copy.previous}
              </button>
              <span className="font-mono text-xs text-ink/50">
                {String(openIndex + 1).padStart(2, "0")} /{" "}
                {String(layouts.length).padStart(2, "0")}
              </span>
              <button
                type="button"
                onClick={() => step(1)}
                className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-ink/70 hover:text-bronze"
              >
                {copy.next} <span aria-hidden>→</span>
              </button>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
