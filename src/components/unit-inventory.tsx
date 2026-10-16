"use client";

import { useEffect, useRef, useState } from "react";
import { BuildingFloorSelector } from "@/components/building-floor-selector";
import { PriceContact } from "@/components/price-contact";
import type { Lang, ProjectInventory, ProjectInventoryUnit } from "@/lib/types";

interface UnitInventoryProps {
  readonly inventory: ProjectInventory;
  readonly lang: Lang;
  readonly projectSlug: string;
}

const COPY = {
  ka: {
    availableApartments: "თავისუფალი ბინა",
    apartmentsShown: "გამოქვეყნებული ბინა",
    price: "ფასი",
    terrace: "თავისუფალი ტერასა",
    available: "თავისუფალია",
    sold: "გაყიდულია",
    apartment: "ბინა",
    interior: "ბინის ფართობი",
    balcony: "აივანი",
    totalArea: "სრული ფართობი",
    note: "ხელმისაწვდომობა შეიძლება შეიცვალოს. ფასისა და მიმდინარე მონაცემებისთვის დაუკავშირდით გაყიდვების გუნდს.",
  },
  en: {
    availableApartments: "Available apartments",
    apartmentsShown: "Published apartments",
    price: "Price",
    terrace: "Available terrace",
    available: "Available",
    sold: "Sold",
    apartment: "Apartment",
    interior: "Interior area",
    balcony: "Balcony",
    totalArea: "Total area",
    note: "Availability may change. Contact the sales team for prices and current details.",
  },
  ru: {
    availableApartments: "Свободные квартиры",
    apartmentsShown: "Опубликованные квартиры",
    price: "Цена",
    terrace: "Свободная терраса",
    available: "Свободно",
    sold: "Продано",
    apartment: "Квартира",
    interior: "Площадь квартиры",
    balcony: "Балкон",
    totalArea: "Общая площадь",
    note: "Наличие может измениться. Цены и актуальные данные уточняйте в отделе продаж.",
  },
} as const;

function formatArea(value: number, lang: Lang) {
  const formatted = Number.isInteger(value)
    ? String(value)
    : String(Number(value.toFixed(2)));
  return lang === "ru" ? formatted.replace(".", ",") : formatted;
}

function unitName(unit: ProjectInventoryUnit, lang: Lang) {
  if (unit.number) return `${COPY[lang].apartment} №${unit.number}`;
  return unit.label?.[lang] ?? unit.id;
}

export function UnitInventory({
  inventory,
  lang,
  projectSlug,
}: UnitInventoryProps) {
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
  const activeAvailable = activeFloor.units.filter(
    (unit) => unit.status === "available",
  ).length;
  const availableTerrace = units.find(
    (unit) => unit.kind === "terrace" && unit.status === "available",
  );

  const handleBuildingFloorSelect = (floorId: string) => {
    setActiveFloorId(floorId);
    requestAnimationFrame(() => {
      floorTabsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
  };

  return (
    <div className="overflow-hidden border border-cream/15 bg-basalt">
      <BuildingFloorSelector
        key={activeFloor.id}
        inventory={inventory}
        lang={lang}
        projectSlug={projectSlug}
        activeFloorId={activeFloor.id}
        onSelectFloor={handleBuildingFloorSelect}
      />

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
            label: copy.price,
            value: (
              <PriceContact
                lang={lang}
                projectSlug={projectSlug}
                placement="inventory-summary"
                variant="buttons"
              />
            ),
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
            {typeof item.value === "string" ? (
              <p className="mt-2 font-mono text-2xl text-cream">{item.value}</p>
            ) : (
              <div className="mt-3">{item.value}</div>
            )}
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

      <div className="bg-ink p-5 md:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <p className="eyebrow">{activeFloor.label[lang]}</p>
          <p className="font-mono text-[10px] tracking-[0.14em] text-cream/50 uppercase">
            {String(activeAvailable).padStart(2, "0")} {copy.available} /{" "}
            {String(activeFloor.units.length).padStart(2, "0")}
          </p>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {activeFloor.units.map((unit) => {
            const isAvailable = unit.status === "available";

            return (
              <article
                key={unit.id}
                className={`flex flex-col border p-5 transition-colors md:p-6 ${
                  isAvailable
                    ? "border-cream/15 bg-basalt hover:border-brass/40"
                    : "border-cream/10 bg-cream/[0.018] text-cream/45"
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
                </dl>

                {isAvailable && (
                  <PriceContact
                    lang={lang}
                    projectSlug={projectSlug}
                    placement="inventory-unit"
                    topic={unitName(unit, lang)}
                    className="mt-4 border-t border-cream/10 pt-4"
                  />
                )}
              </article>
            );
          })}
        </div>
      </div>

      <div className="border-t border-cream/15 px-5 py-5 text-xs text-cream/50 md:px-6">
        <p className="leading-relaxed">{copy.note}</p>
      </div>
    </div>
  );
}
