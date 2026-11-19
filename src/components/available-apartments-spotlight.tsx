import Link from "next/link";
import { PROJECTS } from "@/lib/projects";
import { CONTACT } from "@/lib/site";
import type { Lang } from "@/lib/types";
import { PriceContact } from "./price-contact";

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
const FEATURED_APARTMENTS = ["802", "905", "703"].flatMap((id) =>
  AVAILABLE_APARTMENTS.filter(({ unit }) => unit.id === id),
);

const COPY = {
  ka: {
    eyebrow: "ახლავე ხელმისაწვდომია",
    title: "გასაყიდი ბინები Comfort House-ში",
    apartment: "ბინა",
    floor: "სართული",
    view: "ბინის ნახვა",
    viewAll: `ყველა ${AVAILABLE_APARTMENTS.length} ბინის ნახვა`,
    guide: "როგორ ვიყიდოთ ბინა ბათუმში",
    call: "გაყიდვების გუნდთან დარეკვა",
    note: "ფასი მოთხოვნით. მიმდინარე ფასისა და ხელმისაწვდომობისთვის დაუკავშირდით გაყიდვების გუნდს.",
  },
  en: {
    eyebrow: "Available now",
    title: "Apartments for sale at Comfort House",
    apartment: "Apartment",
    floor: "Floor",
    view: "View apartment",
    viewAll: `View all ${AVAILABLE_APARTMENTS.length} apartments`,
    guide: "How to buy an apartment in Batumi",
    call: "Call the sales team",
    note: "Prices are available on request. Contact the sales team for the current price and availability.",
  },
  ru: {
    eyebrow: "Доступно сейчас",
    title: "Квартиры в продаже в Comfort House",
    apartment: "Квартира",
    floor: "Этаж",
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
    <section id="available-apartments" data-project-slug={COMFORT_HOUSE.slug} className="availability-section">
      <div className="wrap">
        <div className="section-head">
          <div><p className="section-kicker"><i aria-hidden />{copy.eyebrow}</p>
            <h2 className="edition-title">{copy.title}</h2></div>
          <Link href={`/${lang}/apartments`} className="outline-button">{copy.viewAll}<span aria-hidden>↗</span></Link>
        </div>
        <div className="unit-list">
          {FEATURED_APARTMENTS.map(({ unit, floor }) => {
            const number = unit.number ?? unit.id;
            const apartmentHref = `/${lang}/apartments#apartment-${number}`;
            return (
              <article data-home-apartment={number} className="unit-row" key={unit.id}>
                <Link href={apartmentHref} className="unit-name">{copy.apartment} {number}</Link>
                <p>{copy.floor} · {floor.label[lang].split(" · ")[0]}</p>
                <p>{formatArea(unit.totalArea, lang)} {lang === "ka" ? "მ²" : lang === "ru" ? "м²" : "m²"}</p>
                <PriceContact lang={lang} projectSlug={COMFORT_HOUSE.slug} placement="home-apartment"
                  topic={`${copy.apartment} №${number}`} tone="light" variant="buttons" className="unit-contact" />
                <Link href={apartmentHref} className="round-open" aria-label={`${copy.view} · ${number}`}>↗</Link>
              </article>
            );
          })}
        </div>
        <div className="unit-foot">
          <p>{copy.note}</p>
          <Link href={`/${lang}/buying-guide`} className="text-link">{copy.guide}</Link>
          <a href={CONTACT.phoneHref} className="text-link">{copy.call}</a>
        </div>
      </div>
    </section>
  );
}
