"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { inquiryHref } from "@/lib/inquiry-context";
import { getParnavazApartmentModel } from "@/lib/parnavaz-apartment-models";
import { PARNAVAZ_FACADE, PARNAVAZ_FACADE_FLOORS, parnavazFloorState } from "@/lib/parnavaz-facade";
import type { ApartmentLayout, Lang, PricedUnit, ProjectPriceList } from "@/lib/types";

const ApartmentModelViewer = dynamic(() => import("./apartment-model-viewer"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-80 items-center justify-center bg-[#e9e3d8]" role="status" aria-label="3D">
      <span className="size-10 animate-spin rounded-full border border-bronze/20 border-t-bronze motion-reduce:animate-none" />
    </div>
  ),
});

const COPY = {
  ka: {
    eyebrow: "სართულიდან თქვენს ბინამდე",
    title: "შეიხედეთ თქვენს მომავალ სახლში",
    intro: "აირჩიეთ სართული, შემდეგ ბინა და დაათვალიერეთ მისი ინტერიერი 3D-ში.",
    similar: (size: string) => `ნაჩვენებია მსგავსი, ${size} მ² ბინის დიზაინი.`,
    floor: "სართული", apartment: "ბინა", available: "თავისუფალია", sold: "გაყიდულია",
    notForSale: "არ იყიდება", chooseFloor: "აირჩიეთ სართული", chooseApartment: "აირჩიეთ ბინა",
    enter: "ბინაში შესვლა", model: "3D ინტერიერი", plan: "ინტერიერის დიზაინი",
    units: "თავისუფალი ბინა", area: "სრული ფართობი", rate: "ფასი მ²-ზე", total: "სავარაუდო ფასი",
    close: "შენობაზე დაბრუნება", inquiry: "ეს ბინა მაინტერესებს", requestPlan: "ბინის გეგმის მოთხოვნა",
    noModel: "გეგმისა და ინტერიერის დეტალებისთვის დაგვიკავშირდით.",
    soldNote: "ამ სართულზე თავისუფალი ბინა აღარ არის.",
    notForSaleNote: "ეს სართული გასაყიდად არ არის შეთავაზებული.",
    instruction: "შეეხეთ ან დააწკაპუნეთ სართულზე",
    concept: "3D ინტერიერი მოწოდებული დიზაინის მიხედვით შექმნილი კონცეფციაა. ზომები, ავეჯი და მოპირკეთება საორიენტაციოა.",
    confirm: "საბოლოო ფასი და პირობები დააზუსტეთ გაყიდვების გუნდთან.",
    source: "დიზაინის ნახვა", back3d: "3D-ში დაბრუნება",
    bedrooms: "საძინებელი", floorApartments: "ბინები ამ სართულზე",
  },
  en: {
    eyebrow: "From the facade to your home",
    title: "Step inside your future home",
    intro: "Choose a floor, pick an apartment and explore its interior in 3D.",
    similar: (size: string) => `Shown with the design of the similar ${size} m² apartment.`,
    floor: "Floor", apartment: "Apartment", available: "Available", sold: "Sold",
    notForSale: "Not for sale", chooseFloor: "Choose a floor", chooseApartment: "Choose an apartment",
    enter: "Enter apartment", model: "3D interior", plan: "Interior design",
    units: "apartments available", area: "Total area", rate: "Price per m²", total: "Estimated total",
    close: "Back to building", inquiry: "Enquire about this apartment", requestPlan: "Request this apartment's plan",
    noModel: "Contact us for this apartment's plan and interior details.",
    soldNote: "No apartments are available on this floor.",
    notForSaleNote: "This floor is not offered for sale.",
    instruction: "Tap or click a floor to explore",
    concept: "3D interior concept reconstructed from the supplied design. Dimensions, furniture and finishes are indicative.",
    confirm: "Confirm the final price and terms with the sales team.",
    source: "View supplied design", back3d: "Back to 3D",
    bedrooms: "Bedrooms", floorApartments: "Apartments on this floor",
  },
  ru: {
    eyebrow: "От фасада к вашей квартире",
    title: "Загляните в свой будущий дом",
    intro: "Выберите этаж, затем квартиру и посмотрите её интерьер в 3D.",
    similar: (size: string) => `Показан дизайн похожей квартиры ${size} м².`,
    floor: "Этаж", apartment: "Квартира", available: "В продаже", sold: "Продано",
    notForSale: "Не продаётся", chooseFloor: "Выберите этаж", chooseApartment: "Выберите квартиру",
    enter: "Войти в квартиру", model: "3D-интерьер", plan: "Дизайн интерьера",
    units: "квартир в продаже", area: "Общая площадь", rate: "Цена за м²", total: "Расчётная стоимость",
    close: "Вернуться к зданию", inquiry: "Меня интересует эта квартира", requestPlan: "Запросить план квартиры",
    noModel: "Свяжитесь с нами, чтобы получить план и подробности об интерьере.",
    soldNote: "На этом этаже нет свободных квартир.",
    notForSaleNote: "Этот этаж не выставлен на продажу.",
    instruction: "Нажмите на этаж, чтобы посмотреть квартиры",
    concept: "3D-концепция создана по предоставленному дизайну. Размеры, мебель и отделка показаны ориентировочно.",
    confirm: "Окончательную цену и условия уточняйте в отделе продаж.",
    source: "Посмотреть дизайн", back3d: "Вернуться в 3D",
    bedrooms: "Спальни", floorApartments: "Квартиры на этом этаже",
  },
} as const;

const dollars = (value: number) => `$${Math.round(value).toLocaleString("en-US")}`;
const area = (value: number, lang: Lang) => lang === "ru" ? String(value).replace(".", ",") : String(value);

interface ParnavazExplorerProps {
  readonly lang: Lang;
  readonly projectName: string;
  readonly priceList: ProjectPriceList;
  readonly layouts: readonly ApartmentLayout[];
}

function CubeIcon({ className = "size-5" }: { readonly className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden>
      <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
      <path d="m4 7.5 8 4.7 8-4.7M12 12v9m-4-16.3 8 4.5" />
    </svg>
  );
}

export function ParnavazExplorer({ lang, projectName, priceList, layouts }: ParnavazExplorerProps) {
  const copy = COPY[lang];
  const [selectedFloor, setSelectedFloor] = useState(priceList.units[0]?.floor ?? 3);
  const [hoveredFloor, setHoveredFloor] = useState<number | null>(null);
  const [activeUnit, setActiveUnit] = useState<PricedUnit | null>(null);
  const [showDesign, setShowDesign] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const isOpen = activeUnit !== null;
  const previewFloor = hoveredFloor ?? selectedFloor;
  const previewState = parnavazFloorState(priceList, previewFloor);
  const floorUnits = priceList.units.filter((unit) => unit.floor === previewFloor);
  const shape = PARNAVAZ_FACADE_FLOORS.find((floor) => floor.number === previewFloor)!;
  const selectedModel = activeUnit ? getParnavazApartmentModel(activeUnit.totalArea) : undefined;
  // A close-sized apartment borrows its design type's board as well as its model.
  const designArea = selectedModel?.area ?? activeUnit?.totalArea;
  const selectedLayout = activeUnit ? layouts.find((layout) => layout.totalArea === designArea) : undefined;
  const similarDesign = Boolean(activeUnit && selectedModel && selectedModel.area !== activeUnit.totalArea);
  const activeFloorUnits = activeUnit ? priceList.units.filter((unit) => unit.floor === activeUnit.floor) : [];
  const stateLabel = previewState === "available" ? copy.available : previewState === "sold" ? copy.sold : copy.notForSale;

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (!isOpen) {
      if (element.open) element.close();
      return;
    }
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element.showModal();
    return () => {
      document.body.style.overflow = oldOverflow;
      if (element.open) element.close();
    };
  }, [isOpen]);

  function openUnit(unit: PricedUnit) {
    setSelectedFloor(unit.floor);
    setHoveredFloor(null);
    setShowDesign(false);
    setActiveUnit(unit);
  }

  function openFloor(number: number) {
    setSelectedFloor(number);
    setHoveredFloor(null);
    const units = priceList.units.filter((unit) => unit.floor === number);
    if (parnavazFloorState(priceList, number) !== "available") return;
    const first = units.find((unit) => getParnavazApartmentModel(unit.totalArea)) ?? units[0];
    if (first) openUnit(first);
  }

  return (
    <section id="explore" data-project-slug="parnavaz-65" className="draft-grid scroll-mt-20 bg-ink py-20 text-cream md:py-28">
      <div className="wrap">
        <div className="mb-10 grid gap-6 lg:grid-cols-[1.5fr_1fr] lg:items-end">
          <div>
            <p className="eyebrow">{copy.eyebrow}</p>
            <h2 className="mt-5 max-w-3xl font-display text-4xl leading-[1.12] md:text-6xl">{copy.title}</h2>
          </div>
          <div className="lg:max-w-sm lg:justify-self-end">
            <p className="text-sm leading-relaxed text-cream/60">{copy.intro}</p>
            <div className="mt-5 flex flex-wrap items-center gap-3 font-mono text-[10px] tracking-wider text-brass">
              <span>01 / {copy.floor}</span><span className="h-px w-5 bg-brass/40" aria-hidden /><span>02 / {copy.apartment}</span><span className="h-px w-5 bg-brass/40" aria-hidden /><span>03 / 3D</span>
            </div>
          </div>
        </div>

        <div className="overflow-hidden border border-cream/15 bg-basalt lg:grid lg:grid-cols-[minmax(0,1.7fr)_minmax(19rem,.8fr)]">
          <div className="relative self-start overflow-hidden bg-ink" style={{ aspectRatio: `${PARNAVAZ_FACADE.width} / ${PARNAVAZ_FACADE.height}` }} onPointerLeave={() => setHoveredFloor(null)}>
            <Image src="/images/projects/parnavaz-65/render.jpg" alt={projectName} fill sizes="(min-width: 1024px) 65vw, 100vw" quality={90} className="object-contain" />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(11,13,15,.08)_45%,rgba(11,13,15,.6)_100%)]" aria-hidden />
            <svg viewBox={`0 0 ${PARNAVAZ_FACADE.width} ${PARNAVAZ_FACADE.height}`} className="absolute inset-0 h-full w-full" aria-hidden>
              {PARNAVAZ_FACADE_FLOORS.map((floor) => {
                const highlighted = floor.number === previewFloor;
                const available = parnavazFloorState(priceList, floor.number) === "available";
                return <polygon key={floor.number} points={floor.points} data-floor={floor.number}
                  fill={highlighted ? available ? "rgba(197,170,114,.26)" : "rgba(243,240,233,.18)" : "transparent"}
                  stroke={highlighted ? available ? "#dfc58c" : "#f3f0e9" : "transparent"} strokeWidth={2} strokeLinejoin="round" vectorEffect="non-scaling-stroke"
                  className="cursor-pointer transition-[fill,stroke] duration-200 motion-reduce:transition-none"
                  onPointerEnter={() => setHoveredFloor(floor.number)} onClick={() => openFloor(floor.number)} />;
              })}
            </svg>
            <div className="pointer-events-none absolute z-10 transition-[left,top] duration-300 motion-reduce:transition-none" style={{ left: `${shape.marker[0] / PARNAVAZ_FACADE.width * 100}%`, top: `${shape.marker[1] / PARNAVAZ_FACADE.height * 100}%` }} aria-hidden>
              <div className="flex -translate-x-full -translate-y-1/2 items-center">
                <span className={`flex size-7 items-center justify-center rounded-full font-mono text-[11px] shadow-lg sm:size-9 sm:text-sm ${previewState === "available" ? "bg-brass text-ink" : "bg-ink text-cream ring-1 ring-cream/60"}`}>{previewFloor}</span>
                <span className={`h-px w-5 sm:w-8 ${previewState === "available" ? "bg-brass" : "bg-cream/60"}`} />
              </div>
            </div>
            <div className="pointer-events-none absolute top-4 left-4 border-l-2 border-brass bg-ink/85 px-4 py-3 backdrop-blur-md sm:top-6 sm:left-6 sm:px-5 sm:py-4">
              <p className="font-mono text-[9px] tracking-[.16em] text-brass uppercase">{copy.floor}</p>
              <p className="mt-1 font-display text-4xl leading-none sm:text-6xl">{String(previewFloor).padStart(2, "0")}</p>
              <p className="mt-2 text-[10px] text-cream/75">{stateLabel}</p>
            </div>
            <p className="pointer-events-none absolute right-4 bottom-3 left-4 border-t border-cream/30 pt-3 text-right text-[9px] tracking-wide text-cream/90 sm:right-6 sm:bottom-5 sm:left-6 sm:text-[10px]">{copy.instruction}</p>
          </div>

          <div className="flex flex-col p-5 sm:p-7 lg:max-h-[43rem] lg:p-6 xl:p-8">
            <p className="font-mono text-[10px] tracking-[.16em] text-brass uppercase">{copy.chooseFloor}</p>
            <div className="mt-4 grid grid-cols-8 gap-1.5 border-b border-cream/15 pb-6 lg:grid-cols-4">
              {[...PARNAVAZ_FACADE_FLOORS].reverse().map((floor) => (
                <button key={floor.number} type="button" aria-label={`${copy.floor} ${floor.number} · ${parnavazFloorState(priceList, floor.number) === "available" ? copy.available : parnavazFloorState(priceList, floor.number) === "sold" ? copy.sold : copy.notForSale}`}
                  aria-pressed={selectedFloor === floor.number} onClick={() => openFloor(floor.number)}
                  onPointerEnter={() => setHoveredFloor(floor.number)} onPointerLeave={() => setHoveredFloor(null)} onFocus={() => setHoveredFloor(floor.number)} onBlur={() => setHoveredFloor(null)}
                  className={`relative flex min-h-11 items-center justify-center font-mono text-sm transition-colors ${previewFloor === floor.number ? "bg-brass text-ink" : "bg-cream/5 text-cream/60 hover:bg-cream/10"}`}>
                  {floor.number}<span className={`absolute right-1.5 bottom-1.5 size-1 rounded-full ${parnavazFloorState(priceList, floor.number) === "available" ? "bg-brass-bright" : "bg-cream/25"}`} aria-hidden />
                </button>
              ))}
            </div>
            <div className="mt-6 flex items-end justify-between gap-4" aria-live="polite">
              <div><p className="text-xs text-cream/45">{copy.floor}</p><h3 className="mt-1 font-display text-4xl">{String(previewFloor).padStart(2, "0")}</h3></div>
              <p className="max-w-32 text-right text-xs leading-relaxed text-cream/60">{previewState === "available" ? `${floorUnits.length} ${copy.units}` : stateLabel}</p>
            </div>
            <div className="mt-5 min-h-0 space-y-2 lg:overflow-y-auto lg:pr-1">
              {floorUnits.length > 0 && previewState === "available" ? floorUnits.map((unit) => {
                const hasModel = Boolean(getParnavazApartmentModel(unit.totalArea));
                return (
                  <button key={unit.number} type="button" onClick={() => openUnit(unit)} className="group flex min-h-20 w-full items-center justify-between gap-3 border border-cream/12 bg-ink/40 px-4 py-3 text-left transition-colors hover:border-brass/60 hover:bg-brass/5" aria-label={`${copy.apartment} ${unit.number} · ${area(unit.totalArea, lang)} m² · ${hasModel ? copy.enter : copy.requestPlan}`}>
                    <span><span className="block text-[10px] text-cream/45">{copy.apartment}</span><span className="mt-1 block font-mono text-xl">{unit.number}</span></span>
                    <span className="ml-auto text-right"><span className="block font-mono text-sm text-brass">{area(unit.totalArea, lang)} m²</span><span className="mt-1 block text-[10px] text-cream/40">{dollars(unit.pricePerSqm)} / m²</span></span>
                    {hasModel ? <CubeIcon className="ml-2 size-6 text-brass transition-transform group-hover:-translate-y-0.5" /> : <span className="ml-2 text-cream/40" aria-hidden>↗</span>}
                  </button>
                );
              }) : <p className="border-t border-cream/10 pt-5 text-sm leading-relaxed text-cream/55">{previewState === "not-for-sale" ? copy.notForSaleNote : copy.soldNote}</p>}
            </div>
            <p className="mt-auto flex items-center gap-2 pt-6 text-[10px] text-cream/40"><CubeIcon className="size-4 text-brass" />{copy.model}</p>
          </div>
        </div>
      </div>

      <dialog ref={dialog} aria-label={activeUnit ? `${projectName} · ${copy.apartment} ${activeUnit.number}` : projectName}
        onCancel={() => setActiveUnit(null)} onClose={() => setActiveUnit(null)}
        className="apartment-explorer-dialog m-auto h-[96svh] max-h-[60rem] w-[96vw] max-w-[100rem] overflow-hidden border border-brass/25 bg-basalt p-0 text-cream shadow-2xl backdrop:bg-ink/85 backdrop:backdrop-blur-md">
        {activeUnit && (
          <div className="flex h-full min-h-0 flex-col" data-active-apartment={activeUnit.number}>
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-cream/15 px-4 py-2 md:px-7 md:py-4">
              <div><p className="font-mono text-[9px] tracking-[.12em] text-brass uppercase">{projectName} / {copy.floor} {activeUnit.floor}</p><p className="mt-1 font-display text-xl sm:text-2xl">{copy.apartment} {activeUnit.number}</p></div>
              <button type="button" onClick={() => setActiveUnit(null)} className="inline-flex min-h-11 shrink-0 items-center gap-3 px-2 text-xs text-cream/75 hover:text-brass"><span className="hidden sm:inline">{copy.close}</span><span className="text-2xl" aria-hidden>×</span><span className="sr-only sm:hidden">{copy.close}</span></button>
            </div>
            <div data-apartment-content className="min-h-0 flex-1 overflow-y-auto lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:overflow-hidden xl:grid-cols-[minmax(0,1fr)_23rem]">
              <div data-apartment-visual className={`relative flex h-[55svh] min-h-80 flex-col lg:h-full bg-[#e9e3d8]`}>
                {selectedModel && !showDesign ? <ApartmentModelViewer key={`${selectedModel.id}-${activeUnit.number}`} model={selectedModel} lang={lang} allowWalkthrough unit={activeUnit.number} area={activeUnit.totalArea} /> : selectedLayout ? (
                  <div className="relative h-full w-full"><Image src={selectedLayout.image.src} alt={selectedLayout.image.alt[lang]} fill sizes="(min-width: 1024px) 75vw, 96vw" quality={90} className="object-contain p-5" /></div>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-5 px-8 text-center text-ink"><CubeIcon className="size-12 text-bronze/50" /><p className="max-w-sm font-display text-2xl">{copy.noModel}</p><Link href={inquiryHref(lang, "parnavaz-65", activeUnit.number)} data-contact-action="explorer-plan-inquiry" data-project-slug="parnavaz-65" className="inline-flex min-h-12 items-center bg-ink px-5 text-sm text-cream">{copy.requestPlan} <span className="ml-5" aria-hidden>→</span></Link></div>
                )}
              </div>
              <aside data-apartment-sidebar className="flex flex-col border-t border-cream/15 p-5 lg:overflow-y-auto lg:border-t-0 lg:border-l lg:p-6">
                <p className="font-mono text-[9px] tracking-[.12em] text-cream/40 uppercase">{copy.floorApartments} / {activeUnit.floor}</p>
                <div className="mt-3 grid grid-cols-4 gap-1.5">
                  {activeFloorUnits.map((unit) => <button key={unit.number} type="button" onClick={() => openUnit(unit)} aria-pressed={activeUnit.number === unit.number} aria-label={`${copy.apartment} ${unit.number}`} className={`flex min-h-11 items-center justify-center gap-1 font-mono text-xs transition-colors ${activeUnit.number === unit.number ? "bg-brass text-ink" : "bg-cream/5 text-cream/60 hover:bg-cream/10"}`}>{unit.number}{getParnavazApartmentModel(unit.totalArea) && <span className="text-[7px] opacity-60">3D</span>}</button>)}
                </div>
                <div className="mt-7 border-t border-cream/15 pt-6">
                  <p className="text-[10px] text-cream/45">{copy.area}</p>
                  <p className="mt-2 font-display text-5xl text-cream">{area(activeUnit.totalArea, lang)} <span className="text-2xl text-brass">m²</span></p>
                  <dl className="mt-6 space-y-3">
                    {selectedLayout && !similarDesign && <div className="flex items-center justify-between gap-4 text-xs"><dt className="text-cream/45">{copy.bedrooms}</dt><dd>{selectedLayout.bedrooms}</dd></div>}
                    <div className="flex items-center justify-between gap-4 text-xs"><dt className="text-cream/45">{copy.rate}</dt><dd className="font-mono">{dollars(activeUnit.pricePerSqm)}</dd></div>
                    <div className="flex items-center justify-between gap-4 border-t border-cream/10 pt-3 text-xs"><dt className="text-cream/45">{copy.total}</dt><dd className="font-mono text-lg text-brass">{dollars(activeUnit.pricePerSqm * activeUnit.totalArea)}</dd></div>
                  </dl>
                  {similarDesign && selectedModel && <p data-similar-design className="mt-4 border-l-2 border-brass/50 pl-3 text-[11px] leading-relaxed text-cream/55">{copy.similar(area(selectedModel.area, lang))}</p>}
                </div>
                {selectedLayout && selectedModel && <button type="button" onClick={() => setShowDesign(!showDesign)} className="mt-6 flex min-h-11 items-center justify-between border border-cream/20 px-4 text-xs text-cream/70 hover:border-brass hover:text-brass"><span>{showDesign ? copy.back3d : copy.source}</span><span aria-hidden>{showDesign ? "◇" : "↗"}</span></button>}
                <div className="mt-auto pt-7">
                  <Link href={inquiryHref(lang, "parnavaz-65", activeUnit.number)} data-project-slug="parnavaz-65" data-contact-action="apartment-explorer-inquiry" className="flex min-h-12 items-center justify-between gap-4 bg-brass px-4 text-sm font-semibold text-ink transition-colors hover:bg-brass-bright">{copy.inquiry}<span aria-hidden>→</span></Link>
                  <p className="mt-3 text-[10px] leading-relaxed text-cream/40">{copy.confirm}</p>
                </div>
              </aside>
            </div>
            <p className="shrink-0 border-t border-cream/10 px-4 py-3 text-[9px] leading-relaxed text-cream/40 md:px-7">{copy.concept}</p>
          </div>
        )}
      </dialog>
    </section>
  );
}
