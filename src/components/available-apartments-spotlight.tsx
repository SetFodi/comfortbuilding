import Image from "next/image";
import Link from "next/link";
import { PROJECTS } from "@/lib/projects";
import { CONTACT } from "@/lib/site";
import type { Lang } from "@/lib/types";
import { PriceContact } from "./price-contact";
import { Reveal } from "./reveal";

interface AvailableApartmentsSpotlightProps {
  readonly lang: Lang;
}

const COMFORT_HOUSE = PROJECTS.find(
  (project) => project.slug === "comfort-house",
)!;
const INVENTORY = COMFORT_HOUSE.inventory!;
const AVAILABLE_APARTMENTS = INVENTORY.floors.flatMap((floor) =>
  floor.units
    .filter(
      (unit) => unit.kind === "apartment" && unit.status === "available",
    )
    .map((unit) => ({ floor, unit })),
);
/** Each featured apartment is paired with a building render for its card. */
const FEATURED_UNITS = [
  { id: "802", photo: "/images/projects/comfort-house/cover.jpg" },
  { id: "905", photo: "/images/projects/comfort-house/evening.jpg" },
  { id: "703", photo: "/images/experimental-ai/comfort-house-golden-hour.png" },
] as const;
const FEATURED_APARTMENTS = FEATURED_UNITS.flatMap(({ id, photo }) => {
  const apartment = AVAILABLE_APARTMENTS.find(({ unit }) => unit.id === id);
  const image = COMFORT_HOUSE.gallery.find((item) => item.src === photo);
  return apartment && image ? [{ ...apartment, image }] : [];
});

const COPY = {
  ka: {
    eyebrow: "ახლავე ხელმისაწვდომია",
    title: "გასაყიდი ბინები Comfort House-ში",
    lede: "შეადარეთ ბინები ფართობისა და სართულის მიხედვით. სრულ კატალოგში თავმოყრილია ბათუმში გასაყიდად გამოქვეყნებული ბინები, პირდაპირ დეველოპერისგან.",
    count: "გამოქვეყნებული გასაყიდი ბინა",
    available: "გასაყიდია",
    apartment: "ბინა",
    floor: "სართული",
    area: "სრული ფართობი",
    view: "ბინის ნახვა",
    viewAll: `ყველა ${AVAILABLE_APARTMENTS.length} ბინის ნახვა`,
    guide: "როგორ ვიყიდოთ ბინა ბათუმში",
    call: "გაყიდვების გუნდთან დარეკვა",
    note: "ფასი მოთხოვნით. მიმდინარე ფასისა და ხელმისაწვდომობისთვის დაუკავშირდით გაყიდვების გუნდს.",
  },
  en: {
    eyebrow: "Available now",
    title: "Apartments for sale at Comfort House",
    lede: "Compare apartment sizes and floors, then explore the full catalogue of published apartments offered directly by the developer in Batumi.",
    count: "published apartments for sale",
    available: "For sale",
    apartment: "Apartment",
    floor: "Floor",
    area: "Total area",
    view: "View apartment",
    viewAll: `View all ${AVAILABLE_APARTMENTS.length} apartments`,
    guide: "How to buy an apartment in Batumi",
    call: "Call the sales team",
    note: "Prices are available on request. Contact the sales team for the current price and availability.",
  },
  ru: {
    eyebrow: "Доступно сейчас",
    title: "Квартиры в продаже в Comfort House",
    lede: "Сравните площадь и этажи квартир, затем откройте полный каталог опубликованных предложений от застройщика в Батуми.",
    count: "опубликованных квартир в продаже",
    available: "В продаже",
    apartment: "Квартира",
    floor: "Этаж",
    area: "Общая площадь",
    view: "Смотреть квартиру",
    viewAll: `Смотреть все квартиры (${AVAILABLE_APARTMENTS.length})`,
    guide: "Как купить квартиру в Батуми",
    call: "Позвонить в отдел продаж",
    note: "Цена по запросу. Актуальную цену и наличие уточните в отделе продаж.",
  },
} as const;

function formatArea(value: number, lang: Lang) {
  return new Intl.NumberFormat(
    lang === "ka" ? "ka-GE" : lang === "ru" ? "ru-RU" : "en-US",
    { maximumFractionDigits: 1 },
  ).format(value);
}

export function AvailableApartmentsSpotlight({
  lang,
}: AvailableApartmentsSpotlightProps) {
  const copy = COPY[lang];

  return (
    <section
      id="available-apartments"
      data-project-slug="comfort-house"
      className="draft-grid-light relative overflow-hidden bg-limestone py-24 text-ink md:py-32"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 right-6 hidden font-display text-[20rem] leading-none text-ink/[0.035] xl:block"
      >
        {String(AVAILABLE_APARTMENTS.length).padStart(2, "0")}
      </div>

      <div className="wrap relative">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <Reveal>
              <p className="eyebrow eyebrow-on-light">{copy.eyebrow}</p>
              <h2 className="mt-4 max-w-4xl font-display text-4xl leading-[1.08] font-medium md:text-6xl">
                {copy.title}
              </h2>
              <p className="mt-6 max-w-2xl text-[1.02rem] leading-relaxed text-ink/65">
                {copy.lede}
              </p>
            </Reveal>
          </div>

          <Reveal className="lg:col-span-4 lg:border-l lg:border-ink/15 lg:pl-10">
            <div className="flex items-end gap-5">
              <span className="font-display text-8xl leading-[0.75] text-bronze">
                {String(AVAILABLE_APARTMENTS.length).padStart(2, "0")}
              </span>
              <span className="max-w-36 pb-1 font-mono text-[10px] leading-relaxed tracking-[0.12em] text-ink/55 uppercase">
                {copy.count}
              </span>
            </div>
            <Link
              href={`/${lang}/apartments`}
              className="link-slide mt-8 inline-flex min-h-11 items-center gap-3 text-sm font-semibold text-bronze"
            >
              {copy.viewAll} <span aria-hidden>→</span>
            </Link>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {FEATURED_APARTMENTS.map(({ floor, unit, image }, index) => {
            const number = unit.number ?? unit.id;
            const apartmentHref = `/${lang}/apartments#apartment-${number}`;

            return (
              <Reveal key={unit.id} delayMs={index * 90} className="h-full">
                <article
                  data-home-apartment={number}
                  className="group flex h-full flex-col border border-ink/15 bg-paper transition-transform duration-300 hover:-translate-y-1"
                >
                  <Link
                    href={apartmentHref}
                    className="flex flex-col"
                    aria-label={`${copy.view}: ${copy.apartment} ${number}`}
                  >
                    <div className="relative aspect-[16/10] overflow-hidden border-b border-ink/15 bg-limestone">
                      <Image
                        src={image.src}
                        alt={image.alt[lang]}
                        fill
                        sizes="(min-width: 768px) 33vw, 100vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                      />
                      <span className="absolute top-4 left-4 border border-bronze/30 bg-paper/95 px-2.5 py-1 font-mono text-[9px] tracking-[0.12em] text-bronze uppercase backdrop-blur-sm">
                        {copy.available}
                      </span>
                      <span className="absolute right-4 bottom-4 bg-ink px-3 py-2 font-mono text-[9px] tracking-[0.12em] text-cream uppercase">
                        {copy.floor} · {floor.label[lang].split(" · ")[0]}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-5 px-6 pt-6 md:px-7 md:pt-7">
                      <div>
                        <p className="font-mono text-[9px] tracking-[0.14em] text-ink/45 uppercase">
                          Comfort House
                        </p>
                        <h3 className="mt-2 font-display text-3xl leading-none">
                          {copy.apartment} {number}
                        </h3>
                      </div>
                      <p className="font-mono text-sm text-ink/55">
                        {formatArea(unit.totalArea, lang)} m²
                      </p>
                    </div>
                  </Link>

                  <div className="flex flex-1 flex-col px-6 pb-6 md:px-7 md:pb-7">
                    <PriceContact
                      lang={lang}
                      projectSlug={COMFORT_HOUSE.slug}
                      placement="home-apartment"
                      topic={`${copy.apartment} №${number}`}
                      tone="light"
                      className="mt-7 border-y border-ink/12 py-5"
                    />

                    <dl className="mt-5 text-sm">
                      <dt className="font-mono text-[9px] tracking-[0.12em] text-ink/45 uppercase">
                        {copy.area}
                      </dt>
                      <dd className="mt-1 text-ink/75">
                        {formatArea(unit.totalArea, lang)} m²
                      </dd>
                    </dl>

                    <Link
                      href={apartmentHref}
                      className="link-slide mt-auto inline-flex min-h-11 w-fit items-center gap-3 pt-7 text-sm font-semibold text-bronze"
                    >
                      {copy.view} <span aria-hidden>→</span>
                    </Link>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>

        <div className="mt-7 flex flex-col gap-5 border-t border-ink/15 pt-6 text-xs leading-relaxed text-ink/55 md:flex-row md:items-center md:justify-between">
          <p className="max-w-3xl">{copy.note}</p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link
              href={`/${lang}/buying-guide`}
              className="link-slide inline-flex min-h-11 items-center gap-3 font-semibold text-bronze"
            >
              {copy.guide} <span aria-hidden>→</span>
            </Link>
            <a
              href={CONTACT.phoneHref}
              className="link-slide inline-flex min-h-11 shrink-0 items-center gap-3 font-semibold text-bronze"
            >
              {copy.call} <span aria-hidden>↗</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
