"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { Lang, ProjectInventory, ProjectInventoryUnit } from "@/lib/types";

interface UnitInventoryProps {
  readonly inventory: ProjectInventory;
  readonly lang: Lang;
}

const COPY = {
  ka: {
    availableApartments: "თავისუფალი ბინა",
    apartmentsShown: "ბინა გეგმებზე",
    rateRange: "ფასი / მ²",
    terrace: "თავისუფალი ტერასა",
    available: "თავისუფალია",
    sold: "გაყიდულია",
    apartment: "ბინა",
    interior: "ბინის ფართობი",
    balcony: "აივანი",
    totalArea: "სრული ფართობი",
    rate: "ფასი / მ²",
    estimate: "სავარაუდო ფასი",
    onRequest: "ფასი მოთხოვნით",
    source: "წყარო",
    revision: "გეგმის თარიღი",
    download: "PDF-ის ნახვა",
    note: "ხელმისაწვდომობა და ფასი შეიძლება შეიცვალოს. საბოლოო მონაცემები გადაამოწმეთ გაყიდვების გუნდთან.",
  },
  en: {
    availableApartments: "Available apartments",
    apartmentsShown: "Apartments in plans",
    rateRange: "Price / m²",
    terrace: "Available terrace",
    available: "Available",
    sold: "Sold",
    apartment: "Apartment",
    interior: "Interior area",
    balcony: "Balcony",
    totalArea: "Total area",
    rate: "Price / m²",
    estimate: "Estimated total",
    onRequest: "Price on request",
    source: "Source",
    revision: "Plan revision",
    download: "View source PDF",
    note: "Availability and pricing may change. Confirm final figures with the sales team.",
  },
  ru: {
    availableApartments: "Свободные квартиры",
    apartmentsShown: "Квартиры на планах",
    rateRange: "Цена / м²",
    terrace: "Свободная терраса",
    available: "Свободно",
    sold: "Продано",
    apartment: "Квартира",
    interior: "Площадь квартиры",
    balcony: "Балкон",
    totalArea: "Общая площадь",
    rate: "Цена / м²",
    estimate: "Расчётная стоимость",
    onRequest: "Цена по запросу",
    source: "Источник",
    revision: "Дата плана",
    download: "Открыть PDF",
    note: "Наличие и цены могут измениться. Уточняйте итоговые данные у отдела продаж.",
  },
} as const;

function formatArea(value: number, lang: Lang) {
  const formatted = Number.isInteger(value)
    ? String(value)
    : String(Number(value.toFixed(2)));
  return lang === "ru" ? formatted.replace(".", ",") : formatted;
}

function formatMoney(value: number) {
  const grouped = Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `$${grouped}`;
}

function unitName(unit: ProjectInventoryUnit, lang: Lang) {
  if (unit.number) return `${COPY[lang].apartment} №${unit.number}`;
  return unit.label?.[lang] ?? unit.id;
}

export function UnitInventory({ inventory, lang }: UnitInventoryProps) {
  const [activeFloorId, setActiveFloorId] = useState(
    inventory.floors[1]?.id ?? inventory.floors[0]?.id ?? "",
  );
  const floorTabsRef = useRef<HTMLDivElement>(null);
  const activeFloorTabRef = useRef<HTMLButtonElement>(null);
  const activeFloor =
    inventory.floors.find((floor) => floor.id === activeFloorId) ??
    inventory.floors[0];

  useEffect(() => {
    const tabs = floorTabsRef.current;
    const activeTab = activeFloorTabRef.current;
    if (!tabs || !activeTab) return;

    const centeredLeft =
      activeTab.offsetLeft - (tabs.clientWidth - activeTab.offsetWidth) / 2;
    tabs.scrollTo({ left: Math.max(0, centeredLeft) });
  }, [activeFloorId]);

  if (!activeFloor) return null;

  const copy = COPY[lang];
  const units = inventory.floors.flatMap((floor) => floor.units);
  const apartments = units.filter((unit) => unit.kind === "apartment");
  const availableApartments = apartments.filter(
    (unit) => unit.status === "available",
  );
  const availableTerrace = units.find(
    (unit) => unit.kind === "terrace" && unit.status === "available",
  );
  const rates = availableApartments.flatMap((unit) =>
    unit.pricePerSqm ? [unit.pricePerSqm] : [],
  );
  const minRate = Math.min(...rates);
  const maxRate = Math.max(...rates);

  return (
    <div className="overflow-hidden border border-cream/15 bg-basalt">
      <div className="grid border-b border-cream/15 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: copy.availableApartments,
            value: String(availableApartments.length).padStart(2, "0"),
          },
          {
            label: copy.apartmentsShown,
            value: String(apartments.length).padStart(2, "0"),
          },
          {
            label: copy.rateRange,
            value: `${formatMoney(minRate)}–${formatMoney(maxRate)}`,
          },
          {
            label: copy.terrace,
            value: availableTerrace
              ? `${formatArea(availableTerrace.totalArea, lang)} m²`
              : "—",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="border-b border-cream/15 p-5 sm:odd:border-r xl:border-r-0 xl:border-b-0 xl:border-l xl:first:border-l-0"
          >
            <p className="font-mono text-[10px] tracking-[0.16em] text-cream/50 uppercase">
              {item.label}
            </p>
            <p className="mt-2 font-mono text-2xl text-cream">{item.value}</p>
          </div>
        ))}
      </div>

      <div
        ref={floorTabsRef}
        className="flex scroll-smooth gap-px overflow-x-auto border-b border-cream/15 bg-cream/15 p-px motion-reduce:scroll-auto"
      >
        {inventory.floors.map((floor, index) => {
          const available = floor.units.filter(
            (unit) => unit.status === "available",
          ).length;
          const isActive = floor.id === activeFloor.id;

          return (
            <button
              key={floor.id}
              ref={isActive ? activeFloorTabRef : null}
              type="button"
              aria-pressed={isActive}
              onClick={() => setActiveFloorId(floor.id)}
              className={`group min-h-16 min-w-48 shrink-0 px-5 py-3 text-left transition-colors ${
                isActive
                  ? "bg-brass text-ink"
                  : "bg-ink text-cream/65 hover:bg-iron hover:text-cream"
              }`}
            >
              <span className="block font-mono text-[10px] tracking-[0.14em] uppercase opacity-60">
                {String(index + 1).padStart(2, "0")} · {available}{" "}
                {copy.available}
              </span>
              <span className="mt-1 block text-sm font-semibold">
                {floor.label[lang]}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid xl:grid-cols-[minmax(0,1.65fr)_minmax(22rem,.75fr)]">
        <div className="draft-grid-light flex min-h-80 items-center overflow-hidden bg-paper p-2 sm:p-5 xl:min-h-[46rem] xl:border-r xl:border-cream/15">
          <Image
            key={activeFloor.image.src}
            src={activeFloor.image.src}
            alt={activeFloor.image.alt[lang]}
            width={activeFloor.image.width}
            height={activeFloor.image.height}
            sizes="(min-width: 1280px) 66vw, 100vw"
            quality={90}
            className="h-auto w-full bg-white object-contain"
          />
        </div>

        <div className="bg-ink">
          <div className="border-b border-cream/15 p-5 md:p-6">
            <p className="eyebrow">{activeFloor.label[lang]}</p>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-cream/55">
              {activeFloor.image.alt[lang]}
            </p>
          </div>

          <div className="divide-y divide-cream/12">
            {activeFloor.units.map((unit) => {
              const isAvailable = unit.status === "available";
              const estimatedTotal = unit.pricePerSqm
                ? Math.round(unit.totalArea * unit.pricePerSqm)
                : undefined;

              return (
                <article
                  key={unit.id}
                  className={`relative p-5 transition-colors md:p-6 ${
                    isAvailable
                      ? "hover:bg-cream/[0.045]"
                      : "bg-cream/[0.018] text-cream/45"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="font-display text-2xl text-cream">
                      {unitName(unit, lang)}
                    </h3>
                    <span
                      className={`inline-flex shrink-0 items-center gap-2 border px-2.5 py-1 font-mono text-[9px] tracking-[0.13em] uppercase ${
                        isAvailable
                          ? "border-brass/50 bg-brass/10 text-brass-bright"
                          : "border-cream/15 text-cream/40"
                      }`}
                    >
                      <span
                        className={`size-1.5 ${isAvailable ? "bg-brass" : "bg-cream/25"}`}
                        aria-hidden
                      />
                      {isAvailable ? copy.available : copy.sold}
                    </span>
                  </div>

                  <dl className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4 border-t border-cream/10 pt-4 text-sm">
                    {unit.interiorArea !== undefined && (
                      <div>
                        <dt className="font-mono text-[9px] tracking-[0.12em] text-cream/40 uppercase">
                          {copy.interior}
                        </dt>
                        <dd className="mt-1 text-cream/75">
                          {formatArea(unit.interiorArea, lang)} m²
                        </dd>
                      </div>
                    )}
                    {unit.balconyArea !== undefined && (
                      <div>
                        <dt className="font-mono text-[9px] tracking-[0.12em] text-cream/40 uppercase">
                          {copy.balcony}
                        </dt>
                        <dd className="mt-1 text-cream/75">
                          {formatArea(unit.balconyArea, lang)} m²
                        </dd>
                      </div>
                    )}
                    <div>
                      <dt className="font-mono text-[9px] tracking-[0.12em] text-cream/40 uppercase">
                        {copy.totalArea}
                      </dt>
                      <dd className="mt-1 text-cream/75">
                        {formatArea(unit.totalArea, lang)} m²
                      </dd>
                    </div>
                    {isAvailable && (
                      <div>
                        <dt className="font-mono text-[9px] tracking-[0.12em] text-cream/40 uppercase">
                          {copy.rate}
                        </dt>
                        <dd className="mt-1 text-brass-bright">
                          {unit.pricePerSqm
                            ? formatMoney(unit.pricePerSqm)
                            : copy.onRequest}
                        </dd>
                      </div>
                    )}
                  </dl>

                  {isAvailable && estimatedTotal !== undefined && (
                    <div className="mt-4 flex items-end justify-between gap-4 border-t border-cream/10 pt-4">
                      <span className="font-mono text-[9px] tracking-[0.12em] text-cream/40 uppercase">
                        {copy.estimate}
                      </span>
                      <strong className="font-mono text-xl font-medium text-cream">
                        {formatMoney(estimatedTotal)}
                      </strong>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 border-t border-cream/15 px-5 py-5 text-xs text-cream/50 md:flex-row md:items-center md:justify-between md:px-6">
        <p className="leading-relaxed">
          {copy.source}: {inventory.sourceName} · {copy.revision}:{" "}
          {inventory.planRevision}. {copy.note}
        </p>
        <a
          href={inventory.sourceHref}
          target="_blank"
          rel="noopener noreferrer"
          className="link-slide inline-flex min-h-11 shrink-0 items-center gap-2 font-semibold text-brass-bright"
        >
          {copy.download} <span aria-hidden>↗</span>
        </a>
      </div>
    </div>
  );
}
