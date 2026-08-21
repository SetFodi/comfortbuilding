import Image from "next/image";
import Link from "next/link";
import { PROJECTS } from "@/lib/projects";
import { CONTACT } from "@/lib/site";
import type { Lang } from "@/lib/types";
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
const FEATURED_UNIT_IDS = ["802", "905", "703"] as const;
const FEATURED_APARTMENTS = FEATURED_UNIT_IDS.flatMap((id) => {
  const apartment = AVAILABLE_APARTMENTS.find(({ unit }) => unit.id === id);
  return apartment ? [apartment] : [];
});

const COPY = {
  ka: {
    eyebrow: "ახლავე ხელმისაწვდომია",
    title: "გასაყიდი ბინები Comfort House-ში",
    lede: "შეადარეთ სამი განსხვავებული ფართობი და ბიუჯეტი. სრულ კატალოგში თავმოყრილია 11 გამოქვეყნებული ბინა ბათუმში, დეველოპერისგან.",
    count: "გამოქვეყნებული გასაყიდი ბინა",
    available: "გასაყიდია",
    apartment: "ბინა",
    floor: "სართული",
    area: "სრული ფართობი",
    estimate: "სავარაუდო სრული ფასი",
    rate: "ფასი მ²-ზე",
    view: "ბინის ნახვა",
    viewAll: "ყველა 11 ბინის ნახვა",
    call: "გაყიდვების გუნდთან დარეკვა",
    note: "სავარაუდო ფასი გამოთვლილია სრული ფართობისა და გამოქვეყნებული მ²-ის ფასის მიხედვით. ხელმისაწვდომობა და საბოლოო ფასი გადაამოწმეთ გაყიდვების გუნდთან.",
  },
  en: {
    eyebrow: "Available now",
    title: "Apartments for sale at Comfort House",
    lede: "Compare three options across different sizes and budgets. The full catalogue lists 11 published apartments offered directly by the developer in Batumi.",
    count: "published apartments for sale",
    available: "For sale",
    apartment: "Apartment",
    floor: "Floor",
    area: "Total area",
    estimate: "Estimated total",
    rate: "Price per m²",
    view: "View apartment",
    viewAll: "View all 11 apartments",
    call: "Call the sales team",
    note: "The estimate is the published rate per m² multiplied by total area. Confirm current availability and the final price with the sales team.",
  },
  ru: {
    eyebrow: "Доступно сейчас",
    title: "Квартиры в продаже в Comfort House",
    lede: "Сравните три варианта разной площади и стоимости. В полном каталоге опубликовано 11 квартир от застройщика в Батуми.",
    count: "опубликованных квартир в продаже",
    available: "В продаже",
    apartment: "Квартира",
    floor: "Этаж",
    area: "Общая площадь",
    estimate: "Расчётная стоимость",
    rate: "Цена за м²",
    view: "Смотреть квартиру",
    viewAll: "Смотреть все 11 квартир",
    call: "Позвонить в отдел продаж",
    note: "Расчётная стоимость равна общей площади, умноженной на опубликованную цену за м². Уточните наличие и итоговую цену в отделе продаж.",
  },
} as const;

function formatArea(value: number, lang: Lang) {
  return new Intl.NumberFormat(
    lang === "ka" ? "ka-GE" : lang === "ru" ? "ru-RU" : "en-US",
    { maximumFractionDigits: 1 },
  ).format(value);
}

function formatMoney(value: number) {
  return `$${new Intl.NumberFormat("en-US").format(value)}`;
}

export function AvailableApartmentsSpotlight({
  lang,
}: AvailableApartmentsSpotlightProps) {
  const copy = COPY[lang];

  return (
    <section
      id="available-apartments"
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
          {FEATURED_APARTMENTS.map(({ floor, unit }, index) => {
            const number = unit.number ?? unit.id;
            const estimatedTotal = unit.pricePerSqm
              ? Math.round(unit.totalArea * unit.pricePerSqm)
              : undefined;

            return (
              <Reveal key={unit.id} delayMs={index * 90} className="h-full">
                <article
                  data-home-apartment={number}
                  className="group flex h-full flex-col border border-ink/15 bg-paper transition-transform duration-300 hover:-translate-y-1"
                >
                  <Link
                    href={`/${lang}/apartments#apartment-${number}`}
                    className="flex h-full flex-col"
                    aria-label={`${copy.view}: ${copy.apartment} ${number}`}
                  >
                    <div className="relative aspect-[16/10] overflow-hidden border-b border-ink/15 bg-white p-3 md:p-4">
                      <Image
                        src={floor.image.src}
                        alt={floor.image.alt[lang]}
                        fill
                        sizes="(min-width: 768px) 33vw, 100vw"
                        className="object-contain p-3 transition-transform duration-500 group-hover:scale-[1.025] md:p-4"
                      />
                      <span className="absolute top-4 left-4 border border-bronze/30 bg-paper/95 px-2.5 py-1 font-mono text-[9px] tracking-[0.12em] text-bronze uppercase backdrop-blur-sm">
                        {copy.available}
                      </span>
                      <span className="absolute right-4 bottom-4 bg-ink px-3 py-2 font-mono text-[9px] tracking-[0.12em] text-cream uppercase">
                        {copy.floor} · {floor.label[lang].split(" · ")[0]}
                      </span>
                    </div>

                    <div className="flex flex-1 flex-col p-6 md:p-7">
                      <div className="flex items-start justify-between gap-5">
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

                      <div className="mt-7 border-y border-ink/12 py-5">
                        <p className="font-mono text-[9px] tracking-[0.12em] text-ink/45 uppercase">
                          {copy.estimate}
                        </p>
                        <p className="mt-2 font-mono text-3xl text-bronze">
                          {estimatedTotal ? formatMoney(estimatedTotal) : "—"}
                        </p>
                      </div>

                      <dl className="mt-5 grid grid-cols-2 gap-5 text-sm">
                        <div>
                          <dt className="font-mono text-[9px] tracking-[0.12em] text-ink/45 uppercase">
                            {copy.area}
                          </dt>
                          <dd className="mt-1 text-ink/75">
                            {formatArea(unit.totalArea, lang)} m²
                          </dd>
                        </div>
                        <div>
                          <dt className="font-mono text-[9px] tracking-[0.12em] text-ink/45 uppercase">
                            {copy.rate}
                          </dt>
                          <dd className="mt-1 text-ink/75">
                            {unit.pricePerSqm
                              ? `${formatMoney(unit.pricePerSqm)} / m²`
                              : "—"}
                          </dd>
                        </div>
                      </dl>

                      <span className="link-slide mt-7 inline-flex min-h-11 w-fit items-center gap-3 text-sm font-semibold text-bronze">
                        {copy.view} <span aria-hidden>→</span>
                      </span>
                    </div>
                  </Link>
                </article>
              </Reveal>
            );
          })}
        </div>

        <div className="mt-7 flex flex-col gap-5 border-t border-ink/15 pt-6 text-xs leading-relaxed text-ink/55 md:flex-row md:items-center md:justify-between">
          <p className="max-w-3xl">{copy.note}</p>
          <a
            href={CONTACT.phoneHref}
            className="link-slide inline-flex min-h-11 shrink-0 items-center gap-3 self-start font-semibold text-bronze md:self-auto"
          >
            {copy.call} <span aria-hidden>↗</span>
          </a>
        </div>
      </div>
    </section>
  );
}
