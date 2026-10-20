import { PriceContact } from "@/components/price-contact";
import {
  formatUsd,
  priceListSummary,
  ruApartments,
  unitTotal,
} from "@/lib/projects";
import type { Lang, ProjectPriceList as PriceList } from "@/lib/types";

interface ProjectPriceListProps {
  readonly lang: Lang;
  readonly projectSlug: string;
  readonly projectName: string;
  readonly priceList: PriceList;
}

const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

const COPY = {
  ka: {
    eyebrow: "ფასები და ხელმისაწვდომობა",
    title: (count: number, from: string) =>
      `იყიდება ${count} ბინა — ${from}-დან მ²-ზე`,
    lede: "ფასი მითითებულია 1 მ²-ზე და დამოკიდებულია სართულსა და მდებარეობაზე. სავარაუდო სრული ფასი = ფასი მ²-ზე × სრული ფართობი.",
    forSale: "იყიდება ბინა",
    rate: "ფასი მ²-ზე",
    from: "მინიმალური სრული ფასი",
    parking: "ავტოსადგომი",
    parkingValue: (available: number, total: number) =>
      `${available} / ${total} თავისუფალი`,
    floor: (roman: string) => `${roman} სართული`,
    floorCount: (count: number) => `${count} იყიდება`,
    apartment: "ბინა",
    area: "სრული ფართობი",
    perSqm: "მ²-ზე",
    estimate: "სავარაუდო ფასი",
    notForSale: (roman: string) => `${roman} სართული — არ იყიდება`,
    note: (asOf: string) =>
      `ფასები და ხელმისაწვდომობა: ${asOf}. სიაში არმყოფი ბინები გაყიდულია. ფასი შეიძლება შეიცვალოს — საბოლოო პირობები დააზუსტეთ გაყიდვების გუნდთან.`,
  },
  en: {
    eyebrow: "Prices and availability",
    title: (count: number, from: string) =>
      `${count} apartments for sale from ${from}\u00a0/\u00a0m²`,
    lede: "Prices are per m² and depend on the floor and position. Estimated total = price per m² × total area.",
    forSale: "Apartments for sale",
    rate: "Price per m²",
    from: "Estimated totals from",
    parking: "Parking space",
    parkingValue: (available: number, total: number) =>
      `${available} of ${total} available`,
    floor: (roman: string) => `Floor ${roman}`,
    floorCount: (count: number) => `${count} for sale`,
    apartment: "Apartment",
    area: "Total area",
    perSqm: "per m²",
    estimate: "Estimated total",
    notForSale: (roman: string) => `Floor ${roman} — not for sale`,
    note: (asOf: string) =>
      `Prices and availability as of ${asOf}. Apartments not listed are sold. Prices may change — confirm final terms with the sales team.`,
  },
  ru: {
    eyebrow: "Цены и наличие",
    title: (count: number, from: string) =>
      `${count} ${ruApartments(count)} в продаже — от ${from} за м²`,
    lede: "Цена указана за м² и зависит от этажа и расположения. Расчётная стоимость = цена за м² × общая площадь.",
    forSale: "Квартир в продаже",
    rate: "Цена за м²",
    from: "Расчётная стоимость от",
    parking: "Парковочное место",
    parkingValue: (available: number, total: number) =>
      `${available} из ${total} свободно`,
    floor: (roman: string) => `${roman} этаж`,
    floorCount: (count: number) => `${count} в продаже`,
    apartment: "Квартира",
    area: "Общая площадь",
    perSqm: "за м²",
    estimate: "Расчётная стоимость",
    notForSale: (roman: string) => `${roman} этаж — не продаётся`,
    note: (asOf: string) =>
      `Цены и наличие на ${asOf}. Квартиры, которых нет в списке, проданы. Цены могут измениться — итоговые условия уточняйте в отделе продаж.`,
  },
} as const;

function formatArea(value: number, lang: Lang) {
  return lang === "ru" ? String(value).replace(".", ",") : String(value);
}

export function ProjectPriceList({
  lang,
  projectSlug,
  projectName,
  priceList,
}: ProjectPriceListProps) {
  const copy = COPY[lang];
  const summary = priceListSummary(priceList);
  const floors = Array.from(
    new Set(priceList.units.map((unit) => unit.floor)),
  ).sort((a, b) => a - b);
  const title = copy.title(summary.count, formatUsd(summary.minRate));

  const stats = [
    { label: copy.forSale, value: String(summary.count).padStart(2, "0") },
    {
      label: copy.rate,
      value: `${formatUsd(summary.minRate)}–${formatUsd(summary.maxRate)}`,
    },
    { label: copy.from, value: formatUsd(summary.minTotal) },
    ...(priceList.parking
      ? [
          {
            label: copy.parking,
            value: formatUsd(priceList.parking.price),
            detail: copy.parkingValue(
              priceList.parking.available,
              priceList.parking.total,
            ),
          },
        ]
      : []),
  ];

  return (
    <section
      id="prices"
      data-project-slug={projectSlug}
      className="draft-grid scroll-mt-20 bg-ink py-24 md:py-32"
    >
      <div className="wrap">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <p className="eyebrow">{copy.eyebrow}</p>
            <h2 className="mt-4 max-w-4xl font-display text-3xl leading-tight font-medium text-cream md:text-5xl">
              {title}
            </h2>
            <p className="mt-5 max-w-2xl leading-relaxed text-cream/65">
              {copy.lede}
            </p>
          </div>
          <PriceContact
            lang={lang}
            projectSlug={projectSlug}
            projectName={projectName}
            placement="price-list-header"
            variant="buttons"
            className="lg:col-span-4 lg:justify-self-end"
          />
        </div>

        <dl className="mt-12 grid border-t border-l border-cream/15 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="border-r border-b border-cream/15 bg-basalt/70 px-6 py-7"
            >
              <dt className="font-mono text-[10px] tracking-[0.16em] text-cream/50 uppercase">
                {stat.label}
              </dt>
              <dd className="mt-3 font-mono text-2xl text-brass">
                {stat.value}
              </dd>
              {"detail" in stat && stat.detail ? (
                <dd className="mt-1 text-sm text-cream/55">{stat.detail}</dd>
              ) : null}
            </div>
          ))}
        </dl>

        <div className="mt-16 space-y-14">
          {floors.map((floor) => {
            const units = priceList.units.filter((unit) => unit.floor === floor);
            return (
              <div key={floor}>
                <div className="flex flex-wrap items-end justify-between gap-3 border-b border-cream/15 pb-4">
                  <h3 className="font-display text-3xl text-cream">
                    {copy.floor(ROMAN[floor])}
                  </h3>
                  <p className="font-mono text-[10px] tracking-[0.14em] text-cream/50 uppercase">
                    {copy.floorCount(units.length)}
                  </p>
                </div>
                <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {units.map((unit) => (
                    <article
                      key={unit.number}
                      id={`unit-${unit.number}`}
                      className="flex scroll-mt-24 flex-col border border-cream/15 bg-basalt p-5 transition-colors hover:border-brass/40 md:p-6"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <h4 className="font-display text-2xl text-cream">
                          {copy.apartment} №{unit.number}
                        </h4>
                        <p className="font-mono text-sm text-cream/60">
                          {formatArea(unit.totalArea, lang)} m²
                        </p>
                      </div>
                      <dl className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4 border-t border-cream/10 pt-4 text-sm">
                        <div>
                          <dt className="font-mono text-[9px] tracking-[0.12em] text-cream/40 uppercase">
                            {copy.rate}
                          </dt>
                          <dd className="mt-1 font-mono text-lg text-brass-bright">
                            {formatUsd(unit.pricePerSqm)}
                          </dd>
                        </div>
                        <div>
                          <dt className="font-mono text-[9px] tracking-[0.12em] text-cream/40 uppercase">
                            {copy.estimate}
                          </dt>
                          <dd className="mt-1 font-mono text-lg text-cream">
                            {formatUsd(unitTotal(unit))}
                          </dd>
                        </div>
                      </dl>
                      <PriceContact
                        lang={lang}
                        projectSlug={projectSlug}
                        projectName={projectName}
                        placement="price-list-unit"
                        topic={`${copy.apartment} №${unit.number}`}
                        variant="buttons"
                        className="mt-5 border-t border-cream/10 pt-4"
                      />
                    </article>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {priceList.notForSaleFloors?.map((floor) => (
          <p
            key={floor}
            className="mt-10 border-y border-cream/15 py-4 font-mono text-[11px] tracking-[0.14em] text-cream/55 uppercase"
          >
            {copy.notForSale(ROMAN[floor])}
          </p>
        ))}

        <p className="mt-6 max-w-4xl text-xs leading-relaxed text-cream/45">
          {copy.note(priceList.asOf[lang])}
        </p>
      </div>
    </section>
  );
}
