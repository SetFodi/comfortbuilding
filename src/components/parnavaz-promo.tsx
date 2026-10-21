import Image from "next/image";
import Link from "next/link";
import { getParnavazApartmentModel } from "@/lib/parnavaz-apartment-models";
import { PARNAVAZ_FACADE } from "@/lib/parnavaz-facade";
import { facadeOutline, findPlanUnit } from "@/lib/parnavaz-floor-plans";
import { formatUsd, PROJECTS, unitTotal } from "@/lib/projects";
import type { Lang, PricedUnit } from "@/lib/types";
import { Reveal } from "./reveal";

const PROJECT = PROJECTS.find((project) => project.slug === "parnavaz-65")!;
const UNITS = PROJECT.priceList!.units;
const LAYOUTS = PROJECT.layouts!;
const MIN_RATE = Math.min(...UNITS.map((unit) => unit.pricePerSqm));
const MIN_TOTAL = Math.min(...UNITS.map(unitTotal));
const AREAS = UNITS.map((unit) => unit.totalArea);
const WITH_3D = UNITS.filter((unit) => getParnavazApartmentModel(unit.totalArea)).length;

/** Every apartment for sale that faces the street, outlined on the render. */
const GLOWING = UNITS.flatMap((unit) => {
  const found = findPlanUnit(unit.number);
  const outline = found ? facadeOutline(found.plan.floor, found.unit) : null;
  return outline ? [{ number: unit.number, outline }] : [];
});

/** One card per apartment size, opening its lowest-priced apartment in 3D. */
const TYPES = [...new Set(AREAS)].sort((a, b) => a - b).map((area) => {
  const units = UNITS.filter((unit) => unit.totalArea === area);
  const cheapest = units.reduce((best, unit) => unitTotal(unit) < unitTotal(best) ? unit : best);
  const model = getParnavazApartmentModel(area);
  const layout = LAYOUTS.find((item) => item.totalArea === (model?.area ?? area));
  return {
    area,
    units,
    cheapest,
    model,
    layout,
    floors: [...new Set(units.map((unit) => unit.floor))].sort((a, b) => a - b),
  };
});

const COPY = {
  ka: {
    badge: "გაყიდვები მიმდინარეობს",
    eyebrow: "ახალი პროექტი · ფარნავაზ მეფის ქ. №65",
    title: "შეაბიჯეთ თქვენს ბინაში, სანამ აშენდება",
    lede: "აირჩიეთ სართული შენობაზე, ნახეთ გეგმა და დაათვალიერეთ ბინა 3D-ში, მის ოთახებში გასეირნებით. ბათუმში, პირდაპირ დეველოპერისგან.",
    forSale: "გასაყიდი ბინა",
    rate: "მ²-ის ფასი",
    sizes: "ფართობები",
    tours: "3D ტურით",
    from: (value: string) => `${value}-დან`,
    explore: "3D-ში დათვალიერება",
    prices: "ფასები და გეგმები",
    glow: "განათებულია ქუჩის მხარეს გასაყიდი ბინები",
    apartment: "ბინა",
    available: (count: number) => `${count} თავისუფალი`,
    floors: "სართული",
    tour: "3D ტური",
    request: "გეგმა მოთხოვნით",
    total: "სულ",
    scroll: "გადაასრიალეთ ყველა ზომის სანახავად",
    unit: "მ²",
  },
  en: {
    badge: "Now selling",
    eyebrow: "New project · 65 Parnavaz Mepe St.",
    title: "Walk through your apartment before it's built",
    lede: "Pick a floor on the building, open its plan and explore any apartment in 3D, room by room. In Batumi, direct from the developer.",
    forSale: "apartments for sale",
    rate: "per m²",
    sizes: "sizes",
    tours: "with a 3D tour",
    from: (value: string) => `from ${value}`,
    explore: "Explore in 3D",
    prices: "Prices and plans",
    glow: "Lit up: street-side apartments for sale",
    apartment: "Apartment",
    available: (count: number) => `${count} available`,
    floors: "Floors",
    tour: "3D tour",
    request: "Plan on request",
    total: "Total",
    scroll: "Swipe for every size",
    unit: "m²",
  },
  ru: {
    badge: "Продажи открыты",
    eyebrow: "Новый проект · ул. Парнаваз Мепе №65",
    title: "Пройдитесь по квартире ещё до её постройки",
    lede: "Выберите этаж на фасаде, откройте план и осмотрите любую квартиру в 3D, комнату за комнатой. В Батуми, от застройщика.",
    forSale: "квартир в продаже",
    rate: "за м²",
    sizes: "площади",
    tours: "с 3D-туром",
    from: (value: string) => `от ${value}`,
    explore: "Смотреть в 3D",
    prices: "Цены и планы",
    glow: "Подсвечены квартиры в продаже со стороны улицы",
    apartment: "Квартира",
    available: (count: number) => `${count} в продаже`,
    floors: "Этажи",
    tour: "3D-тур",
    request: "План по запросу",
    total: "Итого",
    scroll: "Листайте, чтобы увидеть все площади",
    unit: "м²",
  },
} as const;

const area = (value: number, lang: Lang) =>
  new Intl.NumberFormat(lang === "ka" ? "ka-GE" : lang === "ru" ? "ru-RU" : "en-US", { maximumFractionDigits: 1 }).format(value);

const apartmentHref = (lang: Lang, unit: PricedUnit) =>
  `/${lang}/projects/${PROJECT.slug}?apartment=${unit.number}#explore`;

/**
 * Parnavaz 65 front and centre: the building with its apartments for sale
 * glowing on the facade, live figures from the price list, and a card per
 * apartment size that opens straight into that apartment's 3D view.
 */
export function ParnavazPromo({ lang, placement }: { readonly lang: Lang; readonly placement: "home" | "apartments" }) {
  const copy = COPY[lang];
  const stats = [
    { value: String(UNITS.length), label: copy.forSale },
    { value: copy.from(formatUsd(MIN_RATE)), label: copy.rate },
    { value: `${area(Math.min(...AREAS), lang)}–${area(Math.max(...AREAS), lang)} ${copy.unit}`, label: copy.sizes },
    { value: String(WITH_3D), label: copy.tours },
  ];

  return (
    <section
      data-project-slug={PROJECT.slug}
      data-parnavaz-promo={placement}
      className="relative overflow-hidden bg-ink py-20 text-cream md:py-28"
    >
      <div aria-hidden className="pointer-events-none absolute -top-40 -right-40 size-[44rem] rounded-full bg-brass/10 blur-3xl" />
      <div className="wrap relative grid gap-12 lg:grid-cols-12 lg:items-center lg:gap-14">
        <Reveal className="lg:col-span-7">
          <Link
            href={`/${lang}/projects/${PROJECT.slug}#explore`}
            data-contact-action="promo-facade"
            className="group relative block overflow-hidden border border-cream/15 bg-basalt"
            style={{ aspectRatio: "1440 / 1300" }}
            aria-label={`${PROJECT.name[lang]} · ${copy.explore}`}
          >
            {/* The building, cropped to its two faces, with apartments for sale lit. */}
            <div
              className="absolute transition-transform duration-[1.4s] ease-out group-hover:scale-[1.03] motion-reduce:transition-none"
              style={{ width: `${2400 / 1440 * 100}%`, left: `${-660 / 1440 * 100}%`, top: `${-60 / 1300 * 100}%`, aspectRatio: `${PARNAVAZ_FACADE.width} / ${PARNAVAZ_FACADE.height}` }}
            >
              <Image
                src="/images/projects/parnavaz-65/render.jpg"
                alt={PROJECT.cover.alt[lang]}
                fill
                sizes="(min-width: 1024px) 58vw, 100vw"
                quality={85}
                className="object-cover"
              />
              <svg viewBox={`0 0 ${PARNAVAZ_FACADE.width} ${PARNAVAZ_FACADE.height}`} className="absolute inset-0 h-full w-full" aria-hidden>
                <rect width={PARNAVAZ_FACADE.width} height={PARNAVAZ_FACADE.height} fill="rgba(11,13,15,.38)" />
                {GLOWING.map(({ number, outline }, index) => (
                  <polygon
                    key={number}
                    points={outline}
                    className="promo-glow"
                    style={{ animationDelay: `${(index % 7) * 0.45}s` }}
                    fill="rgba(223,197,140,.42)"
                    stroke="#f3e2b8"
                    strokeWidth={2}
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
              </svg>
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/90 to-transparent px-5 pt-16 pb-4 sm:px-6">
              <p className="flex items-center gap-2 font-mono text-[10px] tracking-[0.14em] text-brass-bright uppercase">
                <span className="size-2 rounded-full bg-brass-bright shadow-[0_0_10px_3px_rgba(223,197,140,.6)]" />
                {copy.glow}
              </p>
            </div>
            <span className="absolute top-4 left-4 inline-flex items-center gap-2 bg-brass px-3 py-2 font-mono text-[10px] font-semibold tracking-[0.14em] text-ink uppercase shadow-lg">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-ink/60 motion-reduce:animate-none" />
                <span className="relative inline-flex size-2 rounded-full bg-ink" />
              </span>
              {copy.badge}
            </span>
          </Link>
        </Reveal>

        <Reveal className="lg:col-span-5" delayMs={120}>
          <p className="eyebrow">{copy.eyebrow}</p>
          <h2 className="mt-5 font-display text-4xl leading-[1.08] font-medium md:text-6xl">{copy.title}</h2>
          <p className="mt-6 max-w-xl text-[1.02rem] leading-relaxed text-cream/65">{copy.lede}</p>
          <dl className="mt-9 grid grid-cols-2 border-t border-l border-cream/15">
            {stats.map((stat) => (
              <div key={stat.label} className="flex min-w-0 flex-col-reverse border-r border-b border-cream/15 px-3 py-5 sm:px-4">
                <dt className="mt-2 font-mono text-[10px] tracking-[0.12em] text-cream/50 uppercase">{stat.label}</dt>
                <dd className="font-display text-2xl leading-none whitespace-nowrap text-brass-bright sm:text-3xl xl:text-4xl">{stat.value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={`/${lang}/projects/${PROJECT.slug}#explore`}
              data-contact-action="promo-explore"
              className="inline-flex min-h-12 items-center gap-3 bg-brass px-6 text-sm font-semibold text-ink transition-colors hover:bg-brass-bright"
            >
              <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
                <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
                <path d="m4 7.5 8 4.7 8-4.7M12 12v9" />
              </svg>
              {copy.explore}
            </Link>
            <Link
              href={`/${lang}/projects/${PROJECT.slug}#prices`}
              className="inline-flex min-h-12 items-center gap-3 border border-cream/30 px-6 text-sm font-semibold text-cream transition-colors hover:border-brass hover:text-brass"
            >
              {copy.prices} <span aria-hidden>→</span>
            </Link>
          </div>
        </Reveal>
      </div>

      <div className="relative mt-14">
        <div className="wrap flex items-end justify-between gap-4">
          <p className="font-mono text-[10px] tracking-[0.14em] text-cream/45 uppercase">
            {copy.total} {copy.from(formatUsd(MIN_TOTAL))}
          </p>
          <p className="font-mono text-[10px] tracking-[0.14em] text-brass/70 uppercase md:hidden">↔ {copy.scroll}</p>
        </div>
        {/* A strip that runs edge to edge and scrolls sideways on every screen. */}
        <ul className="mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain px-[max(clamp(1.25rem,4vw,3.5rem),calc((100vw-90rem)/2+3.5rem))] scroll-px-[max(clamp(1.25rem,4vw,3.5rem),calc((100vw-90rem)/2+3.5rem))] pb-4 [scrollbar-width:thin]">
          {TYPES.map((type) => (
            <li key={type.area} className="w-[17.5rem] shrink-0 snap-start sm:w-[19rem]">
              <Link
                href={apartmentHref(lang, type.cheapest)}
                data-promo-type={type.area}
                className="group flex h-full flex-col border border-cream/15 bg-basalt transition-[transform,border-color] duration-300 hover:-translate-y-1 hover:border-brass/60 motion-reduce:transition-none"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-[#f2efea]">
                  {type.layout ? (
                    <Image
                      src={type.layout.image.src}
                      alt=""
                      fill
                      sizes="19rem"
                      className="object-cover object-[30%_45%] transition-transform duration-700 group-hover:scale-[1.06] motion-reduce:transition-none"
                    />
                  ) : (
                    <Image src={PROJECT.cover.src} alt="" fill sizes="19rem" className="object-cover" />
                  )}
                  <span className={`absolute top-3 left-3 px-2.5 py-1 font-mono text-[9px] tracking-[0.14em] uppercase ${type.model ? "bg-ink text-brass-bright" : "bg-paper text-ink/70"}`}>
                    {type.model ? `◇ ${copy.tour}` : copy.request}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <p className="font-display text-4xl leading-none">
                    {area(type.area, lang)} <span className="text-xl text-cream/50">{copy.unit}</span>
                  </p>
                  <p className="mt-3 font-mono text-sm text-brass-bright">{copy.from(formatUsd(Math.min(...type.units.map((unit) => unit.pricePerSqm))))} / {copy.unit}</p>
                  <p className="mt-1 font-mono text-[11px] text-cream/50">{copy.total} {copy.from(formatUsd(unitTotal(type.cheapest)))}</p>
                  <div className="mt-auto flex items-center justify-between gap-3 border-t border-cream/10 pt-4 text-[11px] text-cream/55">
                    <span>{copy.available(type.units.length)} · {copy.floors} {type.floors.join(", ")}</span>
                    <span aria-hidden className="text-brass transition-transform group-hover:translate-x-1">→</span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
