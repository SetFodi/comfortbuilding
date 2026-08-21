import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContactBand } from "@/components/contact-band";
import { JsonLd } from "@/components/json-ld";
import { PageHero } from "@/components/page-hero";
import { getDict } from "@/lib/dictionary";
import { PROJECTS } from "@/lib/projects";
import {
  absoluteUrl,
  breadcrumbJsonLd,
  jsonLdGraph,
  pageMetadata,
  pagePath,
  SITE_URL,
  webPageJsonLd,
} from "@/lib/seo";
import { CONTACT } from "@/lib/site";
import { isLang, type Lang, type Localized } from "@/lib/types";

const COMFORT_HOUSE = PROJECTS.find(
  (project) => project.slug === "comfort-house",
)!;
const INVENTORY = COMFORT_HOUSE.inventory!;
const HERO_IMAGE =
  COMFORT_HOUSE.heroImage ??
  COMFORT_HOUSE.listingImage ??
  COMFORT_HOUSE.cover;
const FEATURED_PLAN = INVENTORY.floors.find(
  (floor) => floor.id === "level-09",
)!;

const AVAILABLE_APARTMENTS = INVENTORY.floors.flatMap((floor) =>
  floor.units
    .filter(
      (unit) => unit.kind === "apartment" && unit.status === "available",
    )
    .map((unit) => ({ floor, unit })),
);

const META_TITLE: Localized = {
  ka: "ბინები ბათუმში დეველოპერისგან | ფასები და გეგმები",
  en: "Apartments for sale in Batumi | Prices and floor plans",
  ru: "Квартиры в Батуми от застройщика | Цены и планы",
};

const TITLE: Localized = {
  ka: "გასაყიდი ბინები ბათუმში",
  en: "Apartments for sale in Batumi",
  ru: "Квартиры в Батуми от застройщика",
};

const DESCRIPTION: Localized = {
  ka: "Comfort House-ში გასაყიდად გამოქვეყნებული ბინები ბათუმში. შეადარეთ ფართობები, სართულები, გეგმები, ფასი მ²-ზე და სავარაუდო სრული ღირებულება.",
  en: "Published apartments for sale in Comfort House, Batumi. Compare areas, floors, plans, price per m², and estimated total prices.",
  ru: "Опубликованные квартиры в продаже в Comfort House, Батуми. Сравните площадь, этаж, планировку, цену за м² и расчётную стоимость.",
};

const COPY = {
  ka: {
    eyebrow: "ბინები დეველოპერისგან",
    annotation: "11 ბინა / 38.5–142.2 მ² / ბათუმი",
    stats: {
      available: "გამოქვეყნებული თავისუფალი ბინა",
      area: "ხელმისაწვდომი ფართობი",
      rate: "გამოქვეყნებული ფასი / მ²",
      location: "ვ. გორგასლის ქ. №104, №106",
    },
    introEyebrow: "Comfort House · ბათუმი",
    introTitle: "ბინის ყიდვა ბათუმში, კონკრეტული მონაცემებით",
    intro: [
      "ეს გვერდი აერთიანებს Comfort House-ში გასაყიდად გამოქვეყნებულ ბინებს. კომპლექსი მდებარეობს ბათუმში, ვ. გორგასლის ქუჩის №104 და №106 მისამართებზე, 6 მაისის პარკთან ახლოს.",
      "თითოეულ ვარიანტზე ნაჩვენებია შიდა ფართობი, აივანი, სრული ფართობი, სართულის გეგმა და ფასი კვადრატულ მეტრზე. სავარაუდო სრული ფასი გამოთვლილია გამოქვეყნებული ტარიფისა და სრული ფართობის მიხედვით.",
    ],
    projectLink: "Comfort House-ის სრული გვერდი",
    sourceLink: "წყარო PDF-ის ნახვა",
    guideLink: "ბინის ყიდვის გზამკვლევი",
    inventoryEyebrow: "ფასები და ხელმისაწვდომობა",
    inventoryTitle: "შეადარეთ 11 გასაყიდი ბინა",
    inventoryLede:
      "აირჩიეთ ფართობი და სართული. საბოლოო ფასი და ხელმისაწვდომობა გაყიდვების გუნდთან გადაამოწმეთ.",
    apartment: "ბინა",
    floor: "სართული",
    interior: "შიდა ფართობი",
    balcony: "აივანი",
    total: "სრული ფართობი",
    rate: "ფასი / მ²",
    estimate: "სავარაუდო სრული ფასი",
    available: "თავისუფალია",
    plan: "გეგმის ნახვა",
    inquire: "იკითხეთ ამ ბინაზე",
    sourceNote:
      "წყარო: Comfort house-2026.pdf. გეგმის თარიღი: 15.01.2024. ხელმისაწვდომობა და ფასი შეიძლება შეიცვალოს.",
    faqEyebrow: "ხშირი კითხვები",
    faqTitle: "რას ამოწმებს მყიდველი ბინის არჩევამდე",
    faqs: [
      {
        question: "რა ღირს ბინა ბათუმში Comfort House-ში?",
        answer:
          "გამოქვეყნებული ფასი იწყება $1,750-დან კვადრატულ მეტრზე და სართულის მიხედვით $2,500-მდე აღწევს. ხელმისაწვდომი ბინების სავარაუდო სრული ღირებულება ამ გვერდზე $71,225-დან იწყება.",
      },
      {
        question: "რა ფართობის ბინებია ხელმისაწვდომი?",
        answer:
          "გამოქვეყნებულ სიაში ბინების სრული ფართობი 38.5 მ²-დან 142.2 მ²-მდეა. ცალკე ნაჩვენებია ბინის შიდა ფართობი და აივნის ფართობი.",
      },
      {
        question: "სად მდებარეობს Comfort House?",
        answer:
          "საცხოვრებელი კომპლექსი მდებარეობს ბათუმში, ვ. გორგასლის ქუჩის №104 და №106 მისამართებზე, 6 მაისის პარკთან ახლოს.",
      },
      {
        question: "როგორ გადავამოწმო ფასი და ხელმისაწვდომობა?",
        answer: `დაუკავშირდით Comfort Building-ის გაყიდვების გუნდს ნომერზე ${CONTACT.phoneDisplay}. გუნდი დაადასტურებს მიმდინარე სტატუსსა და საბოლოო ფასს.`,
      },
    ],
  },
  en: {
    eyebrow: "Direct from the developer",
    annotation: "11 apartments / 38.5–142.2 m² / Batumi",
    stats: {
      available: "Published available apartments",
      area: "Available apartment sizes",
      rate: "Published price / m²",
      location: "104, 106 V. Gorgasali St.",
    },
    introEyebrow: "Comfort House · Batumi",
    introTitle: "Choose a Batumi apartment using concrete figures",
    intro: [
      "This page collects the apartments published for sale in Comfort House. The building is at 104 and 106 V. Gorgasali Street in Batumi, close to May 6 Park.",
      "Each option shows its interior area, balcony, total area, floor plan, and price per square metre. The estimated total uses the published rate multiplied by the total area.",
    ],
    projectLink: "Full Comfort House project page",
    sourceLink: "View the source PDF",
    guideLink: "Apartment buyer guide",
    inventoryEyebrow: "Prices and availability",
    inventoryTitle: "Compare 11 apartments for sale",
    inventoryLede:
      "Choose an area and floor, then confirm the final price and current availability with the sales team.",
    apartment: "Apartment",
    floor: "Floor",
    interior: "Interior area",
    balcony: "Balcony",
    total: "Total area",
    rate: "Price / m²",
    estimate: "Estimated total",
    available: "Available",
    plan: "View floor plan",
    inquire: "Ask about this apartment",
    sourceNote:
      "Source: Comfort house-2026.pdf. Plan revision: 15.01.2024. Availability and pricing may change.",
    faqEyebrow: "Buyer questions",
    faqTitle: "What to check before choosing an apartment",
    faqs: [
      {
        question: "How much does an apartment in Comfort House cost?",
        answer:
          "Published rates start at $1,750 per square metre and reach $2,500 depending on the floor. Estimated totals for the available apartments shown here start at $71,225.",
      },
      {
        question: "Which apartment sizes are available?",
        answer:
          "The published list ranges from 38.5 m² to 142.2 m² in total area. Interior and balcony areas are shown separately for every apartment.",
      },
      {
        question: "Where is Comfort House in Batumi?",
        answer:
          "Comfort House is at 104 and 106 V. Gorgasali Street in Batumi, close to May 6 Park.",
      },
      {
        question: "How do I confirm the price and availability?",
        answer: `Call the Comfort Building sales team on ${CONTACT.phoneDisplay}. The team will confirm the current status and final price.`,
      },
    ],
  },
  ru: {
    eyebrow: "Квартиры от застройщика",
    annotation: "11 квартир / 38,5–142,2 м² / Батуми",
    stats: {
      available: "Опубликованные свободные квартиры",
      area: "Площадь доступных квартир",
      rate: "Опубликованная цена / м²",
      location: "ул. В. Горгасали №104, №106",
    },
    introEyebrow: "Comfort House · Батуми",
    introTitle: "Покупка квартиры в Батуми с конкретными цифрами",
    intro: [
      "На этой странице собраны квартиры, опубликованные для продажи в Comfort House. Дом находится в Батуми по адресам ул. В. Горгасали №104 и №106, рядом с парком 6 Мая.",
      "Для каждого варианта указаны внутренняя площадь, балкон, общая площадь, план этажа и цена за квадратный метр. Расчётная стоимость основана на опубликованной ставке и общей площади.",
    ],
    projectLink: "Полная страница Comfort House",
    sourceLink: "Открыть исходный PDF",
    guideLink: "Как купить квартиру",
    inventoryEyebrow: "Цены и наличие",
    inventoryTitle: "Сравните 11 квартир в продаже",
    inventoryLede:
      "Выберите площадь и этаж. Итоговую цену и текущее наличие уточните у отдела продаж.",
    apartment: "Квартира",
    floor: "Этаж",
    interior: "Внутренняя площадь",
    balcony: "Балкон",
    total: "Общая площадь",
    rate: "Цена / м²",
    estimate: "Расчётная стоимость",
    available: "Свободно",
    plan: "Смотреть план этажа",
    inquire: "Спросить об этой квартире",
    sourceNote:
      "Источник: Comfort house-2026.pdf. Дата плана: 15.01.2024. Наличие и цены могут измениться.",
    faqEyebrow: "Вопросы покупателей",
    faqTitle: "Что проверить перед выбором квартиры",
    faqs: [
      {
        question: "Сколько стоит квартира в Comfort House?",
        answer:
          "Опубликованная цена начинается от $1,750 за квадратный метр и достигает $2,500 в зависимости от этажа. Расчётная стоимость доступных квартир на этой странице начинается от $71,225.",
      },
      {
        question: "Какие площади квартир доступны?",
        answer:
          "В опубликованном списке общая площадь квартир составляет от 38,5 м² до 142,2 м². Внутренняя площадь и площадь балкона указаны отдельно.",
      },
      {
        question: "Где находится Comfort House?",
        answer:
          "Жилой дом находится в Батуми по адресам ул. В. Горгасали №104 и №106, рядом с парком 6 Мая.",
      },
      {
        question: "Как уточнить цену и наличие?",
        answer: `Позвоните в отдел продаж Comfort Building по номеру ${CONTACT.phoneDisplay}. Команда подтвердит текущий статус и итоговую цену.`,
      },
    ],
  },
} as const;

interface ApartmentsPageProps {
  readonly params: Promise<{ lang: string }>;
}

async function resolveLang(params: ApartmentsPageProps["params"]): Promise<Lang> {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return lang;
}

function formatArea(value: number, lang: Lang) {
  return new Intl.NumberFormat(
    lang === "ru" ? "ru-RU" : lang === "ka" ? "ka-GE" : "en-US",
    { maximumFractionDigits: 1 },
  ).format(value);
}

function formatMoney(value: number) {
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

function apartmentName(lang: Lang, number: string) {
  return `${COPY[lang].apartment} №${number}`;
}

function apartmentsJsonLd(lang: Lang) {
  const url = absoluteUrl(pagePath(lang, "/apartments"));
  const copy = COPY[lang];

  return jsonLdGraph([
    {
      ...webPageJsonLd(
        lang,
        "/apartments",
        META_TITLE[lang],
        DESCRIPTION[lang],
        "CollectionPage",
      ),
      mainEntity: { "@id": `${url}#apartments` },
    },
    {
      "@type": "ItemList",
      "@id": `${url}#apartments`,
      name: TITLE[lang],
      numberOfItems: AVAILABLE_APARTMENTS.length,
      itemListElement: AVAILABLE_APARTMENTS.map(({ unit }, index) => {
        const number = unit.number ?? unit.id;
        const estimatedTotal = unit.pricePerSqm
          ? Math.round(unit.totalArea * unit.pricePerSqm)
          : undefined;

        return {
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@type": "Offer",
            url: `${url}#apartment-${number}`,
            availability: "https://schema.org/InStock",
            priceCurrency: "USD",
            ...(estimatedTotal ? { price: estimatedTotal } : {}),
            seller: { "@id": `${SITE_URL}/#organization` },
            itemOffered: {
              "@type": "Apartment",
              name: apartmentName(lang, number),
              floorSize: {
                "@type": "QuantitativeValue",
                value: unit.totalArea,
                unitCode: "MTK",
              },
              address: {
                "@type": "PostalAddress",
                streetAddress: COMFORT_HOUSE.address[lang],
                addressLocality: COMFORT_HOUSE.city[lang],
                addressCountry: "GE",
              },
            },
            ...(unit.pricePerSqm
              ? {
                  priceSpecification: {
                    "@type": "UnitPriceSpecification",
                    price: unit.pricePerSqm,
                    priceCurrency: "USD",
                    unitCode: "MTK",
                    name: copy.rate,
                  },
                }
              : {}),
          },
        };
      }),
    },
    {
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      mainEntity: copy.faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: { "@type": "Answer", text: faq.answer },
      })),
    },
    breadcrumbJsonLd([
      { name: getDict(lang).nav.home, path: pagePath(lang) },
      { name: TITLE[lang], path: pagePath(lang, "/apartments") },
    ]),
  ]);
}

export async function generateMetadata({
  params,
}: ApartmentsPageProps): Promise<Metadata> {
  const lang = await resolveLang(params);
  return pageMetadata({
    lang,
    title: META_TITLE[lang],
    description: DESCRIPTION[lang],
    suffix: "/apartments",
    image: HERO_IMAGE,
  });
}

export default async function ApartmentsPage({ params }: ApartmentsPageProps) {
  const lang = await resolveLang(params);
  const dict = getDict(lang);
  const copy = COPY[lang];
  const areas = AVAILABLE_APARTMENTS.map(({ unit }) => unit.totalArea);
  const rates = AVAILABLE_APARTMENTS.flatMap(({ unit }) =>
    unit.pricePerSqm ? [unit.pricePerSqm] : [],
  );
  const areaRange = `${formatArea(Math.min(...areas), lang)}–${formatArea(Math.max(...areas), lang)} m²`;
  const rateRange = `${formatMoney(Math.min(...rates))}–${formatMoney(Math.max(...rates))}`;

  return (
    <>
      <JsonLd data={apartmentsJsonLd(lang)} />
      <PageHero
        eyebrow={copy.eyebrow}
        title={TITLE[lang]}
        lede={DESCRIPTION[lang]}
        image={HERO_IMAGE.src}
        imageAlt={HERO_IMAGE.alt[lang]}
        annotation={copy.annotation}
      />

      <section className="border-y border-cream/10 bg-basalt">
        <div className="wrap grid sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: copy.stats.available,
              value: String(AVAILABLE_APARTMENTS.length).padStart(2, "0"),
            },
            { label: copy.stats.area, value: areaRange },
            { label: copy.stats.rate, value: rateRange },
            { label: dict.titleBlock.location, value: copy.stats.location },
          ].map((stat) => (
            <div
              key={stat.label}
              className="-mt-px -ml-px border-t border-l border-cream/10 px-6 py-9"
            >
              <p className="font-mono text-[10px] tracking-[0.16em] text-cream/50 uppercase">
                {stat.label}
              </p>
              <p className="mt-3 font-mono text-xl leading-snug text-brass md:text-2xl">
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="draft-grid-light bg-limestone py-24 text-ink md:py-32">
        <div className="wrap grid gap-14 lg:grid-cols-12 lg:items-center lg:gap-20">
          <div className="lg:col-span-5">
            <p className="eyebrow eyebrow-on-light">{copy.introEyebrow}</p>
            <h2 className="mt-5 font-display text-4xl leading-tight font-medium md:text-6xl">
              {copy.introTitle}
            </h2>
            <div className="mt-8 space-y-5 text-[1.02rem] leading-[1.8] text-ink/70">
              {copy.intro.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href={`/${lang}/projects/comfort-house`}
                className="inline-flex min-h-12 items-center bg-ink px-6 text-sm font-semibold text-cream transition-colors hover:bg-iron"
              >
                {copy.projectLink}
              </Link>
              <a
                href={INVENTORY.sourceHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center border border-ink/30 px-6 text-sm font-semibold text-ink transition-colors hover:border-bronze hover:text-bronze"
              >
                {copy.sourceLink} <span aria-hidden>↗</span>
              </a>
              <Link
                href={`/${lang}/buying-guide`}
                className="inline-flex min-h-12 items-center border border-ink/30 px-6 text-sm font-semibold text-ink transition-colors hover:border-bronze hover:text-bronze"
              >
                {copy.guideLink} <span aria-hidden>→</span>
              </Link>
            </div>
          </div>

          <figure className="lg:col-span-7">
            <div className="overflow-hidden border border-ink/15 bg-white p-2 md:p-5">
              <Image
                src={FEATURED_PLAN.image.src}
                alt={FEATURED_PLAN.image.alt[lang]}
                width={FEATURED_PLAN.image.width}
                height={FEATURED_PLAN.image.height}
                sizes="(min-width: 1024px) 58vw, 100vw"
                className="h-auto w-full"
              />
            </div>
            <figcaption className="mt-3 font-mono text-[10px] tracking-[0.12em] text-ink/55 uppercase">
              {FEATURED_PLAN.image.alt[lang]}
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="draft-grid bg-ink py-24 md:py-32">
        <div className="wrap">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-8">
              <p className="eyebrow">{copy.inventoryEyebrow}</p>
              <h2 className="mt-4 max-w-4xl font-display text-4xl leading-tight font-medium text-cream md:text-6xl">
                {copy.inventoryTitle}
              </h2>
              <p className="mt-5 max-w-2xl leading-relaxed text-cream/65">
                {copy.inventoryLede}
              </p>
            </div>
            <div className="lg:col-span-4 lg:text-right">
              <a
                href={CONTACT.phoneHref}
                className="inline-flex min-h-12 items-center bg-brass px-6 text-sm font-semibold text-ink transition-colors hover:bg-brass-bright"
              >
                {dict.cta.call} · {CONTACT.phoneDisplay}
              </a>
            </div>
          </div>

          <div className="mt-14 grid border-t border-l border-cream/15 md:grid-cols-2 xl:grid-cols-3">
            {AVAILABLE_APARTMENTS.map(({ floor, unit }) => {
              const number = unit.number ?? unit.id;
              const estimatedTotal = unit.pricePerSqm
                ? Math.round(unit.totalArea * unit.pricePerSqm)
                : undefined;

              return (
                <article
                  id={`apartment-${number}`}
                  key={unit.id}
                  className="flex flex-col border-r border-b border-cream/15 bg-basalt/85 p-6 transition-colors hover:bg-iron/80 md:p-7"
                >
                  <div className="flex items-start justify-between gap-5">
                    <div>
                      <p className="font-mono text-[10px] tracking-[0.14em] text-cream/45 uppercase">
                        {copy.floor} · {floor.label[lang]}
                      </p>
                      <h3 className="mt-3 font-display text-3xl text-cream">
                        {apartmentName(lang, number)}
                      </h3>
                    </div>
                    <span className="shrink-0 border border-brass/40 bg-brass/10 px-2.5 py-1 font-mono text-[9px] tracking-[0.12em] text-brass-bright uppercase">
                      {copy.available}
                    </span>
                  </div>

                  <div className="mt-7 border-y border-cream/12 py-5">
                    <p className="font-mono text-[9px] tracking-[0.14em] text-cream/40 uppercase">
                      {copy.estimate}
                    </p>
                    <p className="mt-2 font-mono text-3xl text-brass">
                      {estimatedTotal ? formatMoney(estimatedTotal) : "—"}
                    </p>
                    {unit.pricePerSqm ? (
                      <p className="mt-1 text-sm text-cream/55">
                        {formatMoney(unit.pricePerSqm)} / m²
                      </p>
                    ) : null}
                  </div>

                  <dl className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4 text-sm">
                    <div>
                      <dt className="font-mono text-[9px] tracking-[0.12em] text-cream/40 uppercase">
                        {copy.total}
                      </dt>
                      <dd className="mt-1 text-cream/80">
                        {formatArea(unit.totalArea, lang)} m²
                      </dd>
                    </div>
                    {unit.interiorArea !== undefined ? (
                      <div>
                        <dt className="font-mono text-[9px] tracking-[0.12em] text-cream/40 uppercase">
                          {copy.interior}
                        </dt>
                        <dd className="mt-1 text-cream/80">
                          {formatArea(unit.interiorArea, lang)} m²
                        </dd>
                      </div>
                    ) : null}
                    {unit.balconyArea !== undefined ? (
                      <div>
                        <dt className="font-mono text-[9px] tracking-[0.12em] text-cream/40 uppercase">
                          {copy.balcony}
                        </dt>
                        <dd className="mt-1 text-cream/80">
                          {formatArea(unit.balconyArea, lang)} m²
                        </dd>
                      </div>
                    ) : null}
                    {unit.pricePerSqm ? (
                      <div>
                        <dt className="font-mono text-[9px] tracking-[0.12em] text-cream/40 uppercase">
                          {copy.rate}
                        </dt>
                        <dd className="mt-1 text-cream/80">
                          {formatMoney(unit.pricePerSqm)}
                        </dd>
                      </div>
                    ) : null}
                  </dl>

                  <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2">
                    <Link
                      href={`/${lang}/contact?interest=apartment-${number}#inquiry`}
                      data-contact-action="apartment-inquiry"
                      className="inline-flex min-h-11 items-center bg-brass px-4 text-sm font-semibold text-ink transition-colors hover:bg-brass-bright"
                    >
                      {copy.inquire}
                    </Link>
                    <Link
                      href={`/${lang}/projects/comfort-house#availability`}
                      className="link-slide inline-flex min-h-11 w-fit items-center gap-2 text-sm font-semibold text-brass-bright"
                    >
                      {copy.plan} <span aria-hidden>→</span>
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>

          <p className="mt-5 max-w-4xl text-xs leading-relaxed text-cream/45">
            {copy.sourceNote}
          </p>
        </div>
      </section>

      <section className="draft-grid-light bg-paper py-24 text-ink md:py-32">
        <div className="wrap grid gap-14 lg:grid-cols-12 lg:gap-20">
          <div className="lg:col-span-5">
            <p className="eyebrow eyebrow-on-light">{copy.faqEyebrow}</p>
            <h2 className="mt-4 font-display text-4xl leading-tight font-medium md:text-6xl">
              {copy.faqTitle}
            </h2>
          </div>
          <div className="border-t border-ink/15 lg:col-span-7">
            {copy.faqs.map((faq) => (
              <details key={faq.question} className="group border-b border-ink/15">
                <summary className="flex min-h-20 cursor-pointer list-none items-center justify-between gap-5 py-5 text-lg font-semibold marker:content-none">
                  {faq.question}
                  <span
                    aria-hidden
                    className="font-mono text-2xl font-normal text-bronze transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="max-w-2xl pb-7 leading-relaxed text-ink/65">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <ContactBand lang={lang} dict={dict} />
    </>
  );
}
