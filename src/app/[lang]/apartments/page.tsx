import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContactBand } from "@/components/contact-band";
import { JsonLd } from "@/components/json-ld";
import { PageHero } from "@/components/page-hero";
import { PriceContact } from "@/components/price-contact";
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
import { inquiryHref } from "@/lib/inquiry-context";
import { isLang, type Lang, type Localized } from "@/lib/types";

const COMFORT_HOUSE = PROJECTS.find(
  (project) => project.slug === "comfort-house",
)!;
const INVENTORY = COMFORT_HOUSE.inventory!;
const HERO_IMAGE =
  COMFORT_HOUSE.heroImage ??
  COMFORT_HOUSE.listingImage ??
  COMFORT_HOUSE.cover;
const INTRO_IMAGE = COMFORT_HOUSE.gallery.find(
  (image) => image.src === "/images/projects/comfort-house/evening.jpg",
)!;

const AVAILABLE_APARTMENTS = INVENTORY.floors.flatMap((floor) =>
  floor.units
    .filter(
      (unit) => unit.kind === "apartment" && unit.status === "available",
    )
    .map((unit) => ({ floor, unit })),
);

const META_TITLE: Localized = {
  ka: "ბინები ბათუმში დეველოპერისგან | ხელმისაწვდომობა",
  en: "Apartments for sale in Batumi | Direct from the developer",
  ru: "Квартиры в Батуми от застройщика | Наличие",
};

const TITLE: Localized = {
  ka: "გასაყიდი ბინები ბათუმში",
  en: "Apartments for sale in Batumi",
  ru: "Квартиры в Батуми от застройщика",
};

const DESCRIPTION: Localized = {
  ka: "Comfort House-ში გასაყიდად გამოქვეყნებული ბინები ბათუმში. შეადარეთ ფართობები და სართულები, ფასისთვის კი დაუკავშირდით გაყიდვების გუნდს.",
  en: "Published apartments for sale in Comfort House, Batumi. Compare areas and floors, then call or email the sales team for prices.",
  ru: "Опубликованные квартиры в продаже в Comfort House, Батуми. Сравните площадь и этаж, а цену уточните в отделе продаж.",
};

const COPY = {
  ka: {
    eyebrow: "ბინები დეველოპერისგან",
    annotation: "ბინა",
    stats: {
      available: "გამოქვეყნებული თავისუფალი ბინა",
      area: "ხელმისაწვდომი ფართობი",
      price: "ფასი",
      location: "ვ. გორგასლის ქ. №104, №106",
    },
    introEyebrow: "Comfort House · ბათუმი",
    introTitle: "ბინის ყიდვა ბათუმში, კონკრეტული მონაცემებით",
    intro: [
      "ეს გვერდი აერთიანებს Comfort House-ში გასაყიდად გამოქვეყნებულ ბინებს. კომპლექსი მდებარეობს ბათუმში, ვ. გორგასლის ქუჩის №104 და №106 მისამართებზე, 6 მაისის პარკთან ახლოს.",
      "თითოეულ ვარიანტზე ნაჩვენებია შიდა ფართობი, აივანი და სრული ფართობი. ფასისა და დეტალებისთვის დაგვირეკეთ ან მოგვწერეთ ელფოსტაზე.",
    ],
    projectLink: "Comfort House-ის სრული გვერდი",
    guideLink: "ბინის ყიდვის გზამკვლევი",
    inventoryEyebrow: "ხელმისაწვდომობა",
    inventoryTitle: `შეადარეთ ${AVAILABLE_APARTMENTS.length} გასაყიდი ბინა`,
    inventoryLede:
      "აირჩიეთ ფართობი და სართული, შემდეგ ფასისა და ხელმისაწვდომობისთვის დაუკავშირდით გაყიდვების გუნდს.",
    apartment: "ბინა",
    floor: "სართული",
    interior: "შიდა ფართობი",
    balcony: "აივანი",
    total: "სრული ფართობი",
    available: "თავისუფალია",
    plan: "ფასადზე ნახვა",
    inquire: "იკითხეთ ამ ბინაზე",
    sourceNote:
      "ხელმისაწვდომობა შეიძლება შეიცვალოს.",
    faqEyebrow: "ხშირი კითხვები",
    faqTitle: "რას ამოწმებს მყიდველი ბინის არჩევამდე",
    faqs: [
      {
        question: "რა ღირს ბინა ბათუმში Comfort House-ში?",
        answer: `ფასები საიტზე არ ქვეყნდება. მიმდინარე ფასისა და გადახდის პირობების გასაგებად დაურეკეთ გაყიდვების გუნდს ნომერზე ${CONTACT.phoneDisplay} ან მოწერეთ ${CONTACT.email}-ზე.`,
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
        question: "როგორ გადავამოწმო ხელმისაწვდომობა?",
        answer: `დაუკავშირდით Comfort Building-ის გაყიდვების გუნდს ნომერზე ${CONTACT.phoneDisplay}. გუნდი დაადასტურებს ბინის მიმდინარე სტატუსს და დათვალიერების დროს.`,
      },
    ],
  },
  en: {
    eyebrow: "Direct from the developer",
    annotation: "apartments",
    stats: {
      available: "Published available apartments",
      area: "Available apartment sizes",
      price: "Price",
      location: "104, 106 V. Gorgasali St.",
    },
    introEyebrow: "Comfort House · Batumi",
    introTitle: "Choose a Batumi apartment using concrete figures",
    intro: [
      "This page collects the apartments published for sale in Comfort House. The building is at 104 and 106 V. Gorgasali Street in Batumi, close to May 6 Park.",
      "Each option shows its interior area, balcony, and total area. For prices and more details, call or email the sales team.",
    ],
    projectLink: "Full Comfort House project page",
    guideLink: "Apartment buyer guide",
    inventoryEyebrow: "Availability",
    inventoryTitle: `Compare ${AVAILABLE_APARTMENTS.length} apartments for sale`,
    inventoryLede:
      "Choose an area and floor, then contact the sales team for the price and current availability.",
    apartment: "Apartment",
    floor: "Floor",
    interior: "Interior area",
    balcony: "Balcony",
    total: "Total area",
    available: "Available",
    plan: "View on the facade",
    inquire: "Ask about this apartment",
    sourceNote:
      "Availability may change.",
    faqEyebrow: "Buyer questions",
    faqTitle: "What to check before choosing an apartment",
    faqs: [
      {
        question: "How much does an apartment in Comfort House cost?",
        answer: `Prices are not published on the website. Call the sales team on ${CONTACT.phoneDisplay} or email ${CONTACT.email} for the current price and payment terms.`,
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
        question: "How do I confirm availability?",
        answer: `Call the Comfort Building sales team on ${CONTACT.phoneDisplay}. The team will confirm the apartment's current status and arrange a viewing.`,
      },
    ],
  },
  ru: {
    eyebrow: "Квартиры от застройщика",
    annotation: "квартир",
    stats: {
      available: "Опубликованные свободные квартиры",
      area: "Площадь доступных квартир",
      price: "Цена",
      location: "ул. В. Горгасали №104, №106",
    },
    introEyebrow: "Comfort House · Батуми",
    introTitle: "Покупка квартиры в Батуми с конкретными цифрами",
    intro: [
      "На этой странице собраны квартиры, опубликованные для продажи в Comfort House. Дом находится в Батуми по адресам ул. В. Горгасали №104 и №106, рядом с парком 6 Мая.",
      "Для каждого варианта указаны внутренняя площадь, балкон и общая площадь. Цену и подробности уточняйте по телефону или электронной почте.",
    ],
    projectLink: "Полная страница Comfort House",
    guideLink: "Как купить квартиру",
    inventoryEyebrow: "Наличие",
    inventoryTitle: `Квартиры в продаже: ${AVAILABLE_APARTMENTS.length}`,
    inventoryLede:
      "Выберите площадь и этаж, затем уточните цену и текущее наличие в отделе продаж.",
    apartment: "Квартира",
    floor: "Этаж",
    interior: "Внутренняя площадь",
    balcony: "Балкон",
    total: "Общая площадь",
    available: "Свободно",
    plan: "Смотреть на фасаде",
    inquire: "Спросить об этой квартире",
    sourceNote:
      "Наличие может измениться.",
    faqEyebrow: "Вопросы покупателей",
    faqTitle: "Что проверить перед выбором квартиры",
    faqs: [
      {
        question: "Сколько стоит квартира в Comfort House?",
        answer: `Цены на сайте не публикуются. Позвоните в отдел продаж по номеру ${CONTACT.phoneDisplay} или напишите на ${CONTACT.email}, чтобы узнать актуальную цену и условия оплаты.`,
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
        question: "Как уточнить наличие?",
        answer: `Позвоните в отдел продаж Comfort Building по номеру ${CONTACT.phoneDisplay}. Команда подтвердит текущий статус квартиры и согласует просмотр.`,
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

        return {
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@type": "Offer",
            url: `${url}#apartment-${number}`,
            availability: "https://schema.org/InStock",
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
  const areaRange = areas.length > 0
    ? `${formatArea(Math.min(...areas), lang)}–${formatArea(Math.max(...areas), lang)} m²`
    : "—";

  return (
    <>
      <JsonLd data={apartmentsJsonLd(lang)} />
      <PageHero
        eyebrow={copy.eyebrow}
        title={TITLE[lang]}
        lede={DESCRIPTION[lang]}
        image={HERO_IMAGE.src}
        imageAlt={HERO_IMAGE.alt[lang]}
        annotation={`${AVAILABLE_APARTMENTS.length} ${copy.annotation} / ${areaRange} / ${COMFORT_HOUSE.city[lang]}`}
      />

      <section className="border-y border-cream/10 bg-basalt">
        <div className="wrap grid sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: copy.stats.available,
              value: String(AVAILABLE_APARTMENTS.length).padStart(2, "0"),
            },
            { label: copy.stats.area, value: areaRange },
            {
              label: copy.stats.price,
              value: (
                <PriceContact
                  lang={lang}
                  projectSlug={COMFORT_HOUSE.slug}
                  placement="apartments-summary"
                  variant="buttons"
                />
              ),
            },
            { label: dict.titleBlock.location, value: copy.stats.location },
          ].map((stat) => (
            <div
              key={stat.label}
              className="-mt-px -ml-px border-t border-l border-cream/10 px-6 py-9"
            >
              <p className="font-mono text-[10px] tracking-[0.16em] text-cream/50 uppercase">
                {stat.label}
              </p>
              {typeof stat.value === "string" ? (
                <p className="mt-3 font-mono text-xl leading-snug text-brass md:text-2xl">
                  {stat.value}
                </p>
              ) : (
                <div className="mt-3">{stat.value}</div>
              )}
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
              <Link
                href={`/${lang}/buying-guide`}
                className="inline-flex min-h-12 items-center border border-ink/30 px-6 text-sm font-semibold text-ink transition-colors hover:border-bronze hover:text-bronze"
              >
                {copy.guideLink} <span aria-hidden>→</span>
              </Link>
            </div>
          </div>

          <figure className="lg:col-span-7">
            <div className="overflow-hidden border border-ink/15">
              <Image
                src={INTRO_IMAGE.src}
                alt={INTRO_IMAGE.alt[lang]}
                width={INTRO_IMAGE.width}
                height={INTRO_IMAGE.height}
                sizes="(min-width: 1024px) 58vw, 100vw"
                className="h-auto w-full"
              />
            </div>
            <figcaption className="mt-3 font-mono text-[10px] tracking-[0.12em] text-ink/55 uppercase">
              {INTRO_IMAGE.alt[lang]}
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
                data-project-slug={COMFORT_HOUSE.slug}
                data-contact-action="apartments-call"
                className="inline-flex min-h-12 items-center bg-brass px-6 text-sm font-semibold text-ink transition-colors hover:bg-brass-bright"
              >
                {dict.cta.call} · {CONTACT.phoneDisplay}
              </a>
            </div>
          </div>

          <div className="mt-14 grid border-t border-l border-cream/15 md:grid-cols-2 xl:grid-cols-3">
            {AVAILABLE_APARTMENTS.map(({ floor, unit }) => {
              const number = unit.number ?? unit.id;

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

                  <PriceContact
                    lang={lang}
                    projectSlug={COMFORT_HOUSE.slug}
                    placement="apartment-card"
                    topic={apartmentName(lang, number)}
                    className="mt-7 border-y border-cream/12 py-5"
                  />

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
                  </dl>

                  <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2">
                    <Link
                      href={inquiryHref(lang, COMFORT_HOUSE.slug, number)}
                      data-contact-action="apartment-inquiry"
                      className="link-slide inline-flex min-h-11 w-fit items-center gap-2 text-sm font-semibold text-brass-bright"
                    >
                      {copy.inquire} <span aria-hidden>→</span>
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

      <ContactBand lang={lang} dict={dict} projectSlug={COMFORT_HOUSE.slug} />
    </>
  );
}
