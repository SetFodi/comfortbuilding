"use client";

import Image from "next/image";
import { useState } from "react";
import { PriceContact } from "@/components/price-contact";
import type {
  Lang,
  ProjectInventory,
  ProjectInventoryFloor,
} from "@/lib/types";

interface BuildingFloorSelectorProps {
  readonly inventory: ProjectInventory;
  readonly lang: Lang;
  readonly projectSlug: string;
  readonly activeFloorId: string;
  readonly onSelectFloor: (floorId: string) => void;
}

const COPY = {
  ka: {
    eyebrow: "ინტერაქტიული სართულები",
    title: "აირჩიეთ სართული ფასადიდან",
    instruction: "გადაატარეთ კურსორი ან შეეხეთ შენობის სართულს",
    floor: "სართული",
    available: "თავისუფალია",
    availableUnits: "თავისუფალი ობიექტი",
    sold: "გაყიდულია",
    soldNote: "ამ სართულზე თავისუფალი ბინა აღარ არის.",
    publishedUnits: "გამოქვეყნებული ობიექტი",
    price: "ფასი",
    viewPlan: "სართულის გეგმის ნახვა",
    terrace: "ტერასა",
    terraceAvailable: "თავისუფალი ტერასა · 382.1 მ²",
    legendAvailable: "თავისუფალი ფართებია",
    legendSold: "გაყიდულია",
    imageAlt: "კომფორტ ჰაუსის ფასადი სართულების ინტერაქტიული არჩევით",
  },
  en: {
    eyebrow: "Interactive floors",
    title: "Choose a floor from the facade",
    instruction: "Hover over or tap a level on the building",
    floor: "Floor",
    available: "Available",
    availableUnits: "available unit",
    sold: "Sold",
    soldNote: "No apartments are available on this floor.",
    publishedUnits: "published unit",
    price: "Price",
    viewPlan: "View floor plan",
    terrace: "Terrace",
    terraceAvailable: "Available terrace · 382.1 m²",
    legendAvailable: "Availability published",
    legendSold: "Sold",
    imageAlt: "Comfort House facade with interactive floor selection",
  },
  ru: {
    eyebrow: "Интерактивные этажи",
    title: "Выберите этаж на фасаде",
    instruction: "Наведите курсор или коснитесь этажа здания",
    floor: "Этаж",
    available: "Есть в наличии",
    availableUnits: "свободный объект",
    sold: "Продано",
    soldNote: "На этом этаже нет свободных квартир.",
    publishedUnits: "опубликованный объект",
    price: "Цена",
    viewPlan: "Посмотреть план этажа",
    terrace: "Терраса",
    terraceAvailable: "Свободная терраса · 382,1 м²",
    legendAvailable: "Есть свободные объекты",
    legendSold: "Продано",
    imageAlt: "Фасад Comfort House с интерактивным выбором этажей",
  },
} as const;

type FloorState = "available" | "sold";

interface FloorBand {
  readonly number: number;
  readonly top: number;
  readonly bottom: number;
}

const FLOOR_BANDS: readonly FloorBand[] = [
  { number: 11, top: 4, bottom: 12 },
  { number: 10, top: 12, bottom: 20 },
  { number: 9, top: 20, bottom: 28 },
  { number: 8, top: 28, bottom: 36 },
  { number: 7, top: 36, bottom: 44 },
  { number: 6, top: 44, bottom: 52 },
  { number: 5, top: 52, bottom: 60 },
  { number: 4, top: 60, bottom: 68 },
  { number: 3, top: 68, bottom: 76 },
  { number: 2, top: 76, bottom: 84 },
  { number: 1, top: 84, bottom: 96 },
] as const;

function floorId(number: number) {
  return `level-${String(number).padStart(2, "0")}`;
}

function floorNumber(id: string) {
  const match = id.match(/^level-(\d{2})$/);
  return match ? Number(match[1]) : undefined;
}

function leftEdge(y: number) {
  return 24.6 - y * 0.108;
}

function rightEdge(y: number) {
  return 70 + y * 0.146;
}

function bandPolygon({ top, bottom }: FloorBand) {
  return `polygon(${leftEdge(top)}% ${top}%, ${rightEdge(top)}% ${top}%, ${rightEdge(bottom)}% ${bottom}%, ${leftEdge(bottom)}% ${bottom}%)`;
}

function floorState(floor: ProjectInventoryFloor | undefined): FloorState {
  if (!floor) return "sold";
  return floor.units.some((unit) => unit.status === "available")
    ? "available"
    : "sold";
}

export function BuildingFloorSelector({
  inventory,
  lang,
  projectSlug,
  activeFloorId,
  onSelectFloor,
}: BuildingFloorSelectorProps) {
  const initialFloor = floorNumber(activeFloorId) ?? 8;
  const [selectedFloor, setSelectedFloor] = useState(initialFloor);
  const [hoveredFloor, setHoveredFloor] = useState<number | null>(null);
  const previewNumber = hoveredFloor ?? selectedFloor;
  const copy = COPY[lang];

  const floorById = new Map(
    inventory.floors.map((floor) => [floor.id, floor] as const),
  );
  const previewFloor = floorById.get(floorId(previewNumber));
  const previewState = floorState(previewFloor);
  const previewBand = FLOOR_BANDS.find(
    (band) => band.number === previewNumber,
  );
  const previewUnits = previewFloor?.units ?? [];
  const availableUnits = previewUnits.filter(
    (unit) => unit.status === "available",
  );
  const terrace = inventory.floors.find((floor) => floor.id === "terrace");

  const stateLabel =
    previewState === "available" ? copy.available : copy.sold;

  return (
    <div className="grid overflow-hidden border-b border-cream/15 bg-ink lg:grid-cols-[minmax(0,1.55fr)_minmax(22rem,.75fr)]">
      <div className="relative aspect-[1920/1824] overflow-hidden bg-basalt">
        <Image
          src="/images/projects/comfort-house/facade.jpg"
          alt={copy.imageAlt}
          fill
          sizes="(min-width: 1024px) 66vw, 100vw"
          quality={90}
          className="object-cover"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(11,13,15,.42)_0%,transparent_34%,transparent_76%,rgba(11,13,15,.3)_100%)]"
          aria-hidden
        />

        {FLOOR_BANDS.map((band) => {
          const floor = floorById.get(floorId(band.number));
          const state = floorState(floor);
          const status = state === "available" ? copy.available : copy.sold;

          return (
            <button
              key={band.number}
              type="button"
              aria-label={`${copy.floor} ${band.number} — ${status}`}
              aria-pressed={selectedFloor === band.number}
              onPointerEnter={() => setHoveredFloor(band.number)}
              onPointerLeave={() => setHoveredFloor(null)}
              onFocus={() => setHoveredFloor(band.number)}
              onBlur={() => setHoveredFloor(null)}
              onClick={() => setSelectedFloor(band.number)}
              className="absolute inset-0 z-10 cursor-pointer bg-transparent focus-visible:outline-none"
              style={{ clipPath: bandPolygon(band) }}
            />
          );
        })}

        {previewBand && (
          <div
            className="pointer-events-none absolute z-20 flex -translate-y-1/2 items-center"
            style={{
              top: `${(previewBand.top + previewBand.bottom) / 2}%`,
              left: `${rightEdge((previewBand.top + previewBand.bottom) / 2)}%`,
            }}
            aria-hidden
          >
            <span
              className={`h-px w-8 sm:w-12 ${
                previewState === "available" ? "bg-brass" : "bg-cream/55"
              }`}
            />
            <span
              className={`flex size-7 items-center justify-center rounded-full font-mono text-[9px] shadow-xl backdrop-blur-md sm:size-8 ${
                previewState === "available"
                  ? "bg-brass text-ink"
                  : "bg-ink/90 text-cream/75"
              }`}
            >
              {String(previewNumber).padStart(2, "0")}
            </span>
          </div>
        )}

        <div className="pointer-events-none absolute top-4 left-4 z-20 min-w-32 border-l-2 border-brass bg-ink/88 p-4 shadow-2xl backdrop-blur-md sm:top-6 sm:left-6 sm:min-w-40 sm:p-5">
          <p className="font-mono text-[9px] tracking-[0.18em] text-brass uppercase">
            {copy.floor}
          </p>
          <p className="mt-1 font-display text-5xl leading-none text-cream sm:text-7xl">
            {String(previewNumber).padStart(2, "0")}
          </p>
          <p className="mt-2 flex items-center gap-2 font-mono text-[9px] tracking-[0.12em] text-cream/70 uppercase">
            <span
              className={`size-1.5 rounded-full ${
                previewState === "available" ? "bg-brass" : "bg-cream/35"
              }`}
              aria-hidden
            />
            {stateLabel}
          </p>
        </div>

        <p className="pointer-events-none absolute right-4 bottom-4 left-4 z-20 border-t border-cream/25 pt-3 text-right font-mono text-[9px] tracking-[0.15em] text-cream/75 uppercase sm:right-6 sm:bottom-6 sm:left-6">
          {copy.instruction}
        </p>
      </div>

      <div className="flex min-h-full flex-col bg-basalt p-5 sm:p-7 lg:p-8">
        <div>
          <p className="eyebrow">{copy.eyebrow}</p>
          <h3 className="mt-4 max-w-md font-display text-3xl leading-tight text-cream sm:text-4xl">
            {copy.title}
          </h3>
        </div>

        <div className="mt-7 grid grid-cols-6 gap-1.5 border-y border-cream/15 py-5">
          {FLOOR_BANDS.map((band) => {
            const floor = floorById.get(floorId(band.number));
            const state = floorState(floor);
            const isSelected = selectedFloor === band.number;
            return (
              <button
                key={band.number}
                type="button"
                onPointerEnter={() => setHoveredFloor(band.number)}
                onPointerLeave={() => setHoveredFloor(null)}
                onFocus={() => setHoveredFloor(band.number)}
                onBlur={() => setHoveredFloor(null)}
                onClick={() => setSelectedFloor(band.number)}
                aria-label={`${copy.floor} ${band.number}`}
                aria-pressed={isSelected}
                className={`relative flex aspect-square min-h-11 items-center justify-center rounded-sm font-mono text-sm transition-colors motion-reduce:transition-none ${
                  isSelected
                    ? "bg-brass text-ink shadow-[0_8px_24px_rgba(197,170,114,.16)]"
                    : "bg-cream/[0.035] text-cream/60 hover:bg-cream/[0.09] hover:text-cream"
                }`}
              >
                {band.number}
                <span
                  className={`absolute right-1.5 bottom-1.5 size-1 rounded-full ${
                    state === "available" ? "bg-brass" : "bg-cream/25"
                  }`}
                  aria-hidden
                />
              </button>
            );
          })}
        </div>

        <div className="flex flex-1 flex-col pt-6" aria-live="polite">
          <div className="flex items-start justify-between gap-5">
            <div>
              <p className="font-mono text-[10px] tracking-[0.15em] text-cream/45 uppercase">
                {copy.floor} {previewNumber}
              </p>
              <p className="mt-2 text-lg font-semibold text-cream">
                {previewFloor?.label[lang] ?? `${copy.floor} ${previewNumber}`}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full px-3 py-1.5 font-mono text-[9px] tracking-[0.12em] uppercase ${
                previewState === "available"
                  ? "bg-brass/12 text-brass-bright"
                  : "bg-cream/[0.06] text-cream/50"
              }`}
            >
              {stateLabel}
            </span>
          </div>

          {previewFloor ? (
            <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-cream/12 pt-5">
              <div>
                <dt className="font-mono text-[9px] tracking-[0.13em] text-cream/40 uppercase">
                  {copy.available}
                </dt>
                <dd className="mt-2 font-mono text-2xl text-cream">
                  {String(availableUnits.length).padStart(2, "0")}
                </dd>
              </div>
              <div>
                <dt className="font-mono text-[9px] tracking-[0.13em] text-cream/40 uppercase">
                  {copy.publishedUnits}
                </dt>
                <dd className="mt-2 font-mono text-2xl text-cream">
                  {String(previewUnits.length).padStart(2, "0")}
                </dd>
              </div>
              {availableUnits.length > 0 && (
                <div className="col-span-2 border-t border-cream/12 pt-4">
                  <dt className="font-mono text-[9px] tracking-[0.13em] text-cream/40 uppercase">
                    {copy.price}
                  </dt>
                  <dd className="mt-3">
                    <PriceContact
                      lang={lang}
                      projectSlug={projectSlug}
                      placement="floor-selector"
                      topic={previewFloor.label[lang]}
                      variant="buttons"
                    />
                  </dd>
                </div>
              )}
            </dl>
          ) : (
            <p className="mt-6 border-t border-cream/12 pt-5 text-sm leading-relaxed text-cream/55">
              {copy.soldNote}
            </p>
          )}

          <div className="mt-7 flex flex-col gap-3">
            {previewFloor && (
              <button
                type="button"
                onClick={() => onSelectFloor(previewFloor.id)}
                className="inline-flex min-h-12 items-center justify-between bg-brass px-5 text-sm font-semibold text-ink transition-colors hover:bg-brass-bright"
              >
                {copy.viewPlan} <span aria-hidden>↓</span>
              </button>
            )}

            {terrace && (
              <button
                type="button"
                onClick={() => onSelectFloor(terrace.id)}
                className="flex min-h-11 items-center justify-between border-t border-cream/12 pt-3 text-left text-xs text-cream/60 transition-colors hover:text-brass-bright"
              >
                <span>{copy.terraceAvailable}</span>
                <span aria-hidden>→</span>
              </button>
            )}
          </div>
        </div>

        <div className="mt-7 grid gap-2 border-t border-cream/15 pt-5 font-mono text-[8px] tracking-[0.1em] text-cream/45 uppercase sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          {[
            ["bg-brass", copy.legendAvailable],
            ["bg-cream/25", copy.legendSold],
          ].map(([dot, label]) => (
            <span key={label} className="flex items-center gap-2">
              <span
                className={`size-1.5 shrink-0 rounded-full ${dot}`}
                aria-hidden
              />
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
