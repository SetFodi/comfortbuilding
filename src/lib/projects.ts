import type {
  ApartmentLayout,
  Lang,
  Project,
  ProjectPriceList,
  SiteImage,
} from "./types";
import { COMFORT_HOUSE_INVENTORY } from "./comfort-house-inventory";
import { CONTACT } from "./site";

const PARNAVAZ_65_RENDER: SiteImage = {
  src: "/images/projects/parnavaz-65/render.jpg",
  width: 2400,
  height: 1697,
  alt: {
    ka: "ფარნავაზ მეფის ქ. №65 — მშენებარე 8-სართულიანი საცხოვრებელი სახლის ფოტომონტაჟი ბათუმში",
    en: "Parnavaz Mepe St. №65 — photomontage of the 8-storey residential building under construction in Batumi",
    ru: "ул. Парнаваз Мепе №65 — фотомонтаж строящегося 8-этажного жилого дома в Батуми",
  },
};

/**
 * Transcribed from the sales team's sheet "ქალაქი ბათუმი, ფარნავაზ მეფის
 * ქუჩა #65.pdf". Prices are per m² of total area; apartments not listed are
 * sold, and floor VIII is not for sale. Apartment 701 was confirmed sold on
 * 20 October 2026 and removed from the available inventory.
 */
const PARNAVAZ_65_PRICE_LIST: ProjectPriceList = {
  asOf: { ka: "ოქტომბერი 2026", en: "October 2026", ru: "Октябрь 2026" },
  currency: "USD",
  units: [
    { number: "301", floor: 3, totalArea: 55.3, pricePerSqm: 3000 },
    { number: "304", floor: 3, totalArea: 97.4, pricePerSqm: 3500 },
    { number: "401", floor: 4, totalArea: 55.3, pricePerSqm: 3200 },
    { number: "501", floor: 5, totalArea: 55.3, pricePerSqm: 3200 },
    { number: "503", floor: 5, totalArea: 45.7, pricePerSqm: 3500 },
    { number: "506", floor: 5, totalArea: 54, pricePerSqm: 3500 },
    { number: "507", floor: 5, totalArea: 55.1, pricePerSqm: 3500 },
    { number: "508", floor: 5, totalArea: 117, pricePerSqm: 3400 },
    { number: "601", floor: 6, totalArea: 55.3, pricePerSqm: 3300 },
    { number: "603", floor: 6, totalArea: 45.7, pricePerSqm: 3600 },
    { number: "604", floor: 6, totalArea: 46.5, pricePerSqm: 3600 },
    { number: "605", floor: 6, totalArea: 76.4, pricePerSqm: 3600 },
    { number: "606", floor: 6, totalArea: 50.1, pricePerSqm: 3600 },
    { number: "607", floor: 6, totalArea: 55.1, pricePerSqm: 3600 },
    { number: "608", floor: 6, totalArea: 117, pricePerSqm: 3500 },
    { number: "703", floor: 7, totalArea: 46.3, pricePerSqm: 3700 },
    { number: "704", floor: 7, totalArea: 46.5, pricePerSqm: 3700 },
    { number: "705", floor: 7, totalArea: 43.4, pricePerSqm: 3700 },
    { number: "708", floor: 7, totalArea: 55.1, pricePerSqm: 3700 },
    { number: "709", floor: 7, totalArea: 117, pricePerSqm: 3600 },
  ],
  parking: { price: 40000, available: 9, total: 9 },
  notForSaleFloors: [8],
};

/** Russian needs "квартира / квартиры / квартир" after a number. */
export function ruApartments(count: number) {
  const tens = count % 100;
  const ones = count % 10;
  if (tens >= 11 && tens <= 14) return "квартир";
  if (ones === 1) return "квартира";
  if (ones >= 2 && ones <= 4) return "квартиры";
  return "квартир";
}

export function formatUsd(value: number): string {
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

/** Price per m² multiplied by total area. */
export function unitTotal(unit: ProjectPriceList["units"][number]): number {
  return Math.round(unit.totalArea * unit.pricePerSqm);
}

export function priceListSummary(priceList: ProjectPriceList) {
  const rates = priceList.units.map((unit) => unit.pricePerSqm);
  const areas = priceList.units.map((unit) => unit.totalArea);
  return {
    count: priceList.units.length,
    minArea: Math.min(...areas),
    maxArea: Math.max(...areas),
    minRate: Math.min(...rates),
    maxRate: Math.max(...rates),
    minTotal: Math.min(...priceList.units.map(unitTotal)),
  };
}

const P65 = priceListSummary(PARNAVAZ_65_PRICE_LIST);
const P65_PARKING = PARNAVAZ_65_PRICE_LIST.parking!;

/** Layout boards supplied by the sales team; interiors are design concepts. */
function parnavazLayout(
  totalArea: number,
  bedrooms: number,
  width: number,
  height: number,
): ApartmentLayout {
  const id = totalArea.toFixed(2).replace(/\.00$/, "").replace(".", "-");
  const area = String(totalArea);
  const areaRu = area.replace(".", ",");
  return {
    id,
    totalArea,
    bedrooms,
    image: {
      src: `/images/projects/parnavaz-65/layouts/${id}.jpg`,
      width,
      height,
      alt: {
        ka: `ფარნავაზ მეფის ქ. №65 — ${area} მ² ბინის გეგმა და ინტერიერის კონცეფცია`,
        en: `Parnavaz Mepe St. №65 — ${area} m² apartment layout and interior concept`,
        ru: `ул. Парнаваз Мепе №65 — планировка квартиры ${areaRu} м² и концепция интерьера`,
      },
    },
  };
}

/**
 * Figures, dates, addresses, descriptions, and feature lists are sourced from
 * comfortbuilding.ge (ka/en/ru project pages) and normalized for this design.
 * Where localized pages disagreed on a number, the Georgian page is treated
 * as canonical.
 */
export const PROJECTS: readonly Project[] = [
  {
    slug: "parnavaz-65",
    accent: "#C98A5E",
    status: "ongoing",
    name: {
      ka: "ფარნავაზ მეფის ქ. №65",
      en: "Parnavaz Mepe St. №65",
      ru: "ул. Парнаваз Мепе №65",
    },
    city: { ka: "ბათუმი", en: "Batumi", ru: "Батуми" },
    address: {
      ka: "ფარნავაზ მეფის ქ. №65",
      en: "Parnavaz Mepe St. №65",
      ru: "ул. Парнаваз Мепе №65",
    },
    floorsLabel: "8",
    priceFrom: {
      ka: `${formatUsd(P65.minRate)}-დან / მ²`,
      en: `from ${formatUsd(P65.minRate)} / m²`,
      ru: `от ${formatUsd(P65.minRate)} / м²`,
    },
    areasLabel: {
      ka: `${P65.minArea}–${P65.maxArea} მ²`,
      en: `${P65.minArea}–${P65.maxArea} m²`,
      ru: `${P65.minArea}–${P65.maxArea} м²`.replace(".", ","),
    },
    summary: {
      ka: "იყიდება ბინები ბათუმში, ფარნავაზ მეფის ქუჩაზე — მშენებარე 8-სართულიანი სახლი, შვიდი ტიპის ბინა 45.7-დან 117 მ²-მდე.",
      en: "Apartments for sale in Batumi on Parnavaz Mepe Street — an 8-storey building under construction, with seven layouts from 45.7 to 117 m².",
      ru: "Квартиры в Батуми на улице Парнаваз Мепе — строящийся 8-этажный дом, семь планировок от 45,7 до 117 м².",
    },
    description: {
      ka: [
        "Comfort Building-ის ახალი, მშენებარე 8-სართულიანი საცხოვრებელი სახლი მდებარეობს ბათუმში, ფარნავაზ მეფის ქუჩის №65-ში. ბინები უკვე იყიდება პირდაპირ დეველოპერისგან.",
        `სახლში შვიდი ტიპის ბინაა — 45.7 მ²-იანი ერთსაძინებლიანიდან 117 მ²-იან ორსაძინებლიან ბინამდე, თითოეული აივნით. ინტერიერის კონცეფციები შესრულებულია მშვიდ, ბუნებრივ Japandi სტილში. ფასი 1 მ²-ზე ${formatUsd(P65.minRate)}-დან იწყება.`,
      ],
      en: [
        "A new 8-storey residential building by Comfort Building is under construction at 65 Parnavaz Mepe Street in Batumi. Apartments are already on sale directly from the developer.",
        `There are seven apartment layouts, from a 45.7 m² one-bedroom home to a 117 m² two-bedroom apartment, each with a balcony. The interior concepts follow a calm, natural Japandi style. Prices start at ${formatUsd(P65.minRate)} per m².`,
      ],
      ru: [
        "Новый 8-этажный жилой дом Comfort Building строится в Батуми, на улице Парнаваз Мепе №65. Квартиры уже продаются напрямую от застройщика.",
        `В доме семь планировок — от квартиры 45,7 м² с одной спальней до квартиры 117 м² с двумя спальнями, у каждой есть балкон. Концепции интерьера выполнены в спокойном природном стиле japandi. Цена — от ${formatUsd(P65.minRate)} за м².`,
      ],
    },
    features: {
      ka: [
        "8-სართულიანი საცხოვრებელი სახლი",
        "მშენებარე — ბინები უკვე იყიდება",
        "შვიდი ტიპის ბინა — 45.7-დან 117 მ²-მდე",
        "ერთ- და ორსაძინებლიანი ბინები",
        "აივანი ყველა ტიპის ბინაში",
        "ინტერიერის კონცეფცია Japandi სტილში",
      ],
      en: [
        "8-storey residential building",
        "Under construction — apartments on sale now",
        "Seven apartment layouts from 45.7 to 117 m²",
        "One- and two-bedroom apartments",
        "A balcony in every layout",
        "Japandi-style interior concepts",
      ],
      ru: [
        "8-этажный жилой дом",
        "Строится — квартиры уже в продаже",
        "Семь планировок квартир — от 45,7 до 117 м²",
        "Квартиры с одной и двумя спальнями",
        "Балкон в каждой планировке",
        "Концепции интерьера в стиле japandi",
      ],
    },
    availability: [
      {
        label: {
          ka: "იყიდება ბინა",
          en: "Apartments for sale",
          ru: "Квартир в продаже",
        },
        value: String(P65.count),
      },
      {
        label: {
          ka: "ფასი მ²-ზე",
          en: "Price per m²",
          ru: "Цена за м²",
        },
        value: `${formatUsd(P65.minRate)}–${formatUsd(P65.maxRate)}`,
      },
      {
        label: {
          ka: "ავტოსადგომი",
          en: "Parking spaces",
          ru: "Парковочные места",
        },
        value: `${P65_PARKING.available} · ${formatUsd(P65_PARKING.price)}`,
      },
    ],
    layouts: [
      parnavazLayout(45.7, 1, 853, 1276),
      parnavazLayout(46.5, 1, 1024, 1273),
      parnavazLayout(50.1, 1, 1017, 1265),
      parnavazLayout(55.1, 1, 1017, 1268),
      parnavazLayout(55.3, 2, 1280, 915),
      parnavazLayout(76.4, 2, 1280, 930),
      parnavazLayout(117, 2, 1280, 878),
    ],
    faqs: {
      ka: [
        {
          question: "სად მდებარეობს სახლი?",
          answer: "სახლი მდებარეობს ბათუმში, ფარნავაზ მეფის ქუჩის №65-ში.",
        },
        {
          question: "რა ფართის ბინები იყიდება?",
          answer: `III–VII სართულებზე იყიდება ${P65.count} ბინა, ${P65.minArea}-დან ${P65.maxArea} მ²-მდე. ძირითადი ტიპებია ერთსაძინებლიანი — 45.7, 46.5, 50.1 და 55.1 მ², და ორსაძინებლიანი — 55.3, 76.4 და 117 მ², ყველა აივნით.`,
        },
        {
          question: "რა ღირს ბინა ფარნავაზ მეფის ქ. №65-ში?",
          answer: `თავისუფალი ბინების ფასი 1 მ²-ზე ${formatUsd(P65.minRate)}-დან ${formatUsd(P65.maxRate)}-მდეა, სართულისა და მდებარეობის მიხედვით. სავარაუდო სრული ღირებულება ${formatUsd(P65.minTotal)}-დან იწყება. საბოლოო ფასი დააზუსტეთ გაყიდვების გუნდთან: ${CONTACT.phoneDisplay}.`,
        },
        {
          question: "არის ავტოსადგომი?",
          answer: `დიახ. ${P65_PARKING.total}-დან ${P65_PARKING.available} ავტოსადგომი იყიდება, თითოეული ${formatUsd(P65_PARKING.price)}.`,
        },
        {
          question: "სახლი უკვე შენდება?",
          answer:
            "დიახ. ფარნავაზ მეფის ქ. №65-ში 8-სართულიანი საცხოვრებელი სახლი შენდება, ბინები კი უკვე იყიდება პირდაპირ Comfort Building-ისგან.",
        },
      ],
      en: [
        {
          question: "Where is the building?",
          answer: "The building is at 65 Parnavaz Mepe Street in Batumi.",
        },
        {
          question: "Which apartment sizes are for sale?",
          answer: `${P65.count} apartments from ${P65.minArea} to ${P65.maxArea} m² are for sale on floors III–VII. The main layouts are one-bedroom apartments of 45.7, 46.5, 50.1 and 55.1 m², and two-bedroom apartments of 55.3, 76.4 and 117 m², each with a balcony.`,
        },
        {
          question: "How much does an apartment at 65 Parnavaz Mepe Street cost?",
          answer: `Available apartments cost ${formatUsd(P65.minRate)} to ${formatUsd(P65.maxRate)} per m², depending on the floor and position. Estimated totals start at ${formatUsd(P65.minTotal)}. Confirm the final price with the sales team on ${CONTACT.phoneDisplay}.`,
        },
        {
          question: "Is there parking?",
          answer: `Yes. ${P65_PARKING.available} of ${P65_PARKING.total} parking spaces are for sale, at ${formatUsd(P65_PARKING.price)} each.`,
        },
        {
          question: "Is the building under construction?",
          answer:
            "Yes. The 8-storey residential building at 65 Parnavaz Mepe Street is under construction, and apartments are already on sale directly from Comfort Building.",
        },
      ],
      ru: [
        {
          question: "Где находится дом?",
          answer: "Дом находится в Батуми, на улице Парнаваз Мепе №65.",
        },
        {
          question: "Какие квартиры продаются?",
          answer: `На III–VII этажах в продаже ${P65.count} ${ruApartments(P65.count)} площадью от ${String(P65.minArea).replace(".", ",")} до ${P65.maxArea} м². Основные планировки — с одной спальней (45,7, 46,5, 50,1 и 55,1 м²) и с двумя спальнями (55,3, 76,4 и 117 м²), у каждой есть балкон.`,
        },
        {
          question: "Сколько стоит квартира на ул. Парнаваз Мепе №65?",
          answer: `Свободные квартиры стоят от ${formatUsd(P65.minRate)} до ${formatUsd(P65.maxRate)} за м² в зависимости от этажа и расположения. Расчётная стоимость — от ${formatUsd(P65.minTotal)}. Итоговую цену уточните в отделе продаж: ${CONTACT.phoneDisplay}.`,
        },
        {
          question: "Есть ли парковка?",
          answer: `Да. В продаже ${P65_PARKING.available} из ${P65_PARKING.total} парковочных мест, по ${formatUsd(P65_PARKING.price)} каждое.`,
        },
        {
          question: "Дом уже строится?",
          answer:
            "Да. На ул. Парнаваз Мепе №65 строится 8-этажный жилой дом, квартиры уже продаются напрямую от Comfort Building.",
        },
      ],
    },
    priceList: PARNAVAZ_65_PRICE_LIST,
    mapQuery: "Parnavaz Mepe Street 65, Batumi, Georgia",
    cover: PARNAVAZ_65_RENDER,
    heroImageMobile: {
      src: "/images/projects/parnavaz-65/render-mobile.jpg",
      width: 1200,
      height: 1599,
      alt: PARNAVAZ_65_RENDER.alt,
    },
    gallery: [PARNAVAZ_65_RENDER],
  },
  {
    slug: "comfort-house",
    accent: "#B4835A",
    status: "ongoing",
    name: {
      ka: "კომფორტ ჰაუსი",
      en: "Comfort House",
      ru: "Комфорт Хаус",
    },
    city: { ka: "ბათუმი", en: "Batumi", ru: "Батуми" },
    address: {
      ka: "ვ. გორგასლის ქ. №104, №106",
      en: "V. Gorgasali St. №104, №106",
      ru: "ул. В. Горгасали №104, №106",
    },
    floorsLabel: "10",
    startYear: 2022,
    endYear: 2024,
    startDate: { ka: "ივლისი 2022", en: "July 2022", ru: "Июль 2022" },
    endDate: { ka: "აგვისტო 2024", en: "August 2024", ru: "Август 2024" },
    priceOnRequest: true,
    areasLabel: {
      ka: "38.5–142.2 მ²",
      en: "38.5–142.2 m²",
      ru: "38,5–142,2 м²",
    },
    summary: {
      ka: "საცხოვრებელი კომპლექსი ბათუმში — თანამედროვე, კომფორტული სახლი ქალაქის ცხოვრების წყნარი ატმოსფეროთი, „6 მაისის“ პარკთან ახლოს.",
      en: "A residential complex in Batumi — a modern, comfortable home in a calm corner of city life, close to May 6 Park.",
      ru: "Жилой комплекс в Батуми — современный, комфортный дом в спокойной атмосфере городской жизни, рядом с парком «6 мая».",
    },
    description: {
      ka: [
        "საცხოვრებელი კომპლექსი „Comfort House“ — ეს თანამედროვე, კომფორტული სახლია, გარემოცული ქალაქის ცხოვრების სასიამოვნო, წყნარი ატმოსფეროთი.",
        "სახლი მდებარეობს ვ. გორგასლის №104-ში, სადაც წარმატებულადაა შერწყმული მოხერხებული ინფრასტრუქტურა. ახლოსაა „6 მაისის“ პარკი — მნიშვნელოვანი ადგილი პატარებისთვის, სუფთა ჰაერი და მშვიდი გარემო. 10-სართულიანი სახლი უდავოდ იქცევა კომფორტულ საცხოვრებლად თავისი ბინადრებისთვის.",
      ],
      en: [
        "The Comfort House residential complex is a modern, comfortable home surrounded by the pleasant, quiet atmosphere of city life.",
        "The building stands at V. Gorgasali St. 104, where convenient infrastructure meets calm surroundings. May 6 Park — an important place for children, fresh air and a peaceful environment — is close by. The 10-storey house will undoubtedly become a comfortable home for its residents.",
      ],
      ru: [
        "Жилой комплекс «Comfort House» — это современный, комфортный дом, окружённый приятной, тихой атмосферой городской жизни.",
        "Дом расположен на ул. В. Горгасали №104, где удачно сочетается удобная инфраструктура и спокойная обстановка. Рядом парк «6 мая» — важное место для детей, свежий воздух и тишина. 10-этажный дом, бесспорно, станет комфортным жильём для своих жителей.",
      ],
    },
    features: {
      ka: [
        "შავი კარკასი / თეთრი კარკასი",
        "ბუნებრივი გაზი, წყალი, ელექტროობა, ინტერნეტი, ტელეფონი, საკაბელო ტელევიზია",
        "წყლისა და გაზის მრიცხველები",
        "იტალიური ლიფტი",
        "კეთილმოწყობილი ეზო",
        "კომერციული ფართები პირველ სართულზე — 162,1 მ²",
      ],
      en: [
        "Black frame / white frame finish",
        "Natural gas, water, electricity, internet, telephone, cable TV",
        "Water and gas meters installed",
        "Italian elevator",
        "Landscaped yard",
        "Ground-floor commercial space — 162.1 m²",
      ],
      ru: [
        "Чёрный каркас / белый каркас",
        "Природный газ, вода, электричество, интернет, телефон, кабельное ТВ",
        "Установлены счётчики воды и газа",
        "Итальянский лифт",
        "Обустроенный двор",
        "Коммерческие помещения на первом этаже — 162,1 м²",
      ],
    },
    availability: [
      {
        label: {
          ka: "თავისუფალი ბინა",
          en: "Available apartments",
          ru: "Свободные квартиры",
        },
        value: "10",
      },
      {
        label: { ka: "ტერასა", en: "Terrace", ru: "Терраса" },
        value: "1",
      },
    ],
    inventory: COMFORT_HOUSE_INVENTORY,
    mapQuery: "Gorgasali Street 104, Batumi, Georgia",
    cover: {
      src: "/images/experimental-ai/comfort-house-golden-hour.png",
      width: 1517,
      height: 1037,
      alt: {
        ka: "კომფორტ ჰაუსის გაუმჯობესებული ვიზუალიზაცია ოქროს საათზე",
        en: "Enhanced golden-hour visualisation of Comfort House",
        ru: "Улучшенная визуализация Комфорт Хаус в золотой час",
      },
    },
    gallery: [
      {
        src: "/images/experimental-ai/comfort-house-golden-hour.png",
        width: 1517,
        height: 1037,
        alt: {
          ka: "კომფორტ ჰაუსი — გაუმჯობესებული ვიზუალიზაცია ოქროს საათზე",
          en: "Comfort House — enhanced golden-hour visualisation",
          ru: "Комфорт Хаус — улучшенная визуализация в золотой час",
        },
      },
      {
        src: "/images/projects/comfort-house/facade.jpg",
        width: 1920,
        height: 1824,
        alt: {
          ka: "კომფორტ ჰაუსის მთავარი ფასადი",
          en: "Comfort House main facade",
          ru: "Главный фасад Комфорт Хаус",
        },
      },
      {
        src: "/images/projects/comfort-house/cover.jpg",
        width: 1920,
        height: 1312,
        alt: {
          ka: "კომფორტ ჰაუსი ქუჩის ხედით",
          en: "Comfort House street view",
          ru: "Комфорт Хаус, вид с улицы",
        },
      },
      {
        src: "/images/projects/comfort-house/street.jpg",
        width: 1920,
        height: 1221,
        alt: {
          ka: "კომფორტ ჰაუსის შესასვლელი",
          en: "Comfort House entrance",
          ru: "Вход в Комфорт Хаус",
        },
      },
      {
        src: "/images/projects/comfort-house/evening.jpg",
        width: 1920,
        height: 1329,
        alt: {
          ka: "კომფორტ ჰაუსი საღამოს",
          en: "Comfort House in the evening",
          ru: "Комфорт Хаус вечером",
        },
      },
      {
        src: "/images/projects/comfort-house/tower.jpg",
        width: 1920,
        height: 2304,
        alt: {
          ka: "კომფორტ ჰაუსის კორპუსი",
          en: "Comfort House tower",
          ru: "Корпус Комфорт Хаус",
        },
      },
    ],
  },
  {
    slug: "house-near-piazza",
    accent: "#9B5745",
    status: "completed",
    name: {
      ka: "სახლი პიაცასთან",
      en: "House near the Piazza",
      ru: "Дом возле Пьяццы",
    },
    city: { ka: "ბათუმი", en: "Batumi", ru: "Батуми" },
    address: {
      ka: "ვ. გორგასლის ქ. №15",
      en: "V. Gorgasali St. №15",
      ru: "ул. В. Горгасали №15",
    },
    floorsLabel: "5",
    startYear: 2019,
    endYear: 2020,
    startDate: {
      ka: "აგვისტო 2019",
      en: "August 2019",
      ru: "Август 2019",
    },
    endDate: {
      ka: "აგვისტო 2020",
      en: "August 2020",
      ru: "Август 2020",
    },
    summary: {
      ka: "მყუდრო ხუთსართულიანი სახლი ძველ ბათუმში — პიაცის მოედანთან და სანაპიროდან 200 მეტრში.",
      en: "A cosy five-storey house in old Batumi — near Piazza Square and 200 metres from the beach.",
      ru: "Уютный пятиэтажный дом в старом Батуми — рядом с площадью Пьяцца и в 200 метрах от пляжа.",
    },
    description: {
      ka: [
        "მყუდრო, ხუთსართულიანი სახლი აგებულია ქალაქ ბათუმის ძველ უბანში, ვ. გორგასლის ქუჩა №15-ში — პიაცის მოედნის ახლოს, სანაპიროდან 200 მეტრში.",
      ],
      en: [
        "This cosy five-storey house stands in Batumi’s old district at 15 V. Gorgasali Street — close to Piazza Square and 200 metres from the beach.",
      ],
      ru: [
        "Уютный пятиэтажный дом построен в старом районе Батуми по адресу ул. В. Горгасали, 15 — рядом с площадью Пьяцца, в 200 метрах от пляжа.",
      ],
    },
    features: {
      ka: ["მიწისქვეშა ავტოსადგომი"],
      en: ["Underground parking"],
      ru: ["Подземный паркинг"],
    },
    soldPercent: 100,
    availability: [],
    mapQuery: "Vakhtang Gorgasali Street 15, Batumi, Georgia",
    cover: {
      src: "/images/experimental-ai/house-near-piazza-enhanced.png",
      width: 1419,
      height: 1109,
      alt: {
        ka: "სახლი პიაცასთან — გაუმჯობესებული არქიტექტურული ფოტო",
        en: "House near the Piazza — enhanced architectural photograph",
        ru: "Дом возле Пьяццы — улучшенная архитектурная фотография",
      },
    },
    gallery: [
      {
        src: "/images/experimental-ai/house-near-piazza-enhanced.png",
        width: 1419,
        height: 1109,
        alt: {
          ka: "სახლი პიაცასთან — გაუმჯობესებული არქიტექტურული ფოტო",
          en: "House near the Piazza — enhanced architectural photograph",
          ru: "Дом возле Пьяццы — улучшенная архитектурная фотография",
        },
      },
      {
        src: "/images/projects/house-near-piazza/cover.jpg",
        width: 2400,
        height: 1871,
        alt: {
          ka: "სახლი პიაცასთან, ვ. გორგასლის ქუჩიდან",
          en: "House near the Piazza from V. Gorgasali Street",
          ru: "Дом возле Пьяццы со стороны улицы В. Горгасали",
        },
      },
      {
        src: "/images/projects/house-near-piazza/facade.jpg",
        width: 2400,
        height: 1800,
        alt: {
          ka: "სახლის მთავარი ფასადი ძველ ბათუმში",
          en: "Main facade of the house in old Batumi",
          ru: "Главный фасад дома в старом Батуми",
        },
      },
      {
        src: "/images/projects/house-near-piazza/street.jpg",
        width: 2400,
        height: 1800,
        alt: {
          ka: "სახლი პიაცასთან — ქუჩის პანორამა",
          en: "House near the Piazza — street panorama",
          ru: "Дом возле Пьяццы — панорама улицы",
        },
      },
    ],
  },
  {
    slug: "house-on-parnavaz",
    accent: "#82909A",
    status: "completed",
    name: {
      ka: "სახლი ფარნავაზზე",
      en: "House on Parnavaz Mepe",
      ru: "Дом на Парнаваза",
    },
    city: { ka: "ბათუმი", en: "Batumi", ru: "Батуми" },
    address: {
      ka: "ფარნავაზ მეფის ქ. №150",
      en: "Parnavaz Mepe St. №150",
      ru: "ул. Парнаваз Мепе №150",
    },
    floorsLabel: "13",
    startYear: 2017,
    endYear: 2020,
    startDate: {
      ka: "აგვისტო 2017",
      en: "August 2017",
      ru: "Август 2017",
    },
    endDate: {
      ka: "დეკემბერი 2020",
      en: "December 2020",
      ru: "Декабрь 2020",
    },
    summary: {
      ka: "თანამედროვე საცხოვრებელი სახლი ბათუმში, ფარნავაზ მეფის ქუჩაზე — „6 მაისის“ პარკთან ახლოს.",
      en: "A modern residential house on Parnavaz Mepe Street in Batumi — close to May 6 Park.",
      ru: "Современный жилой дом на улице Парнаваз Мепе в Батуми — рядом с парком «6 мая».",
    },
    description: {
      ka: [
        "საცხოვრებელი კომპლექსი „სახლი ფარნავაზზე“ თანამედროვე, კომფორტული სახლია, გარემოცული მშვიდი ქალაქური ატმოსფეროთი და ბუნებასთან ჰარმონიით. სახლი მდებარეობს ფარნავაზ მეფის ქუჩა №150-ში, „6 მაისის“ პარკთან ახლოს.",
      ],
      en: [
        "House on Parnavaz Mepe is a modern, comfortable residence surrounded by a calm city atmosphere and harmony with nature. It stands at 150 Parnavaz Mepe Street, close to May 6 Park.",
      ],
      ru: [
        "«Дом на Парнаваза» — современный комфортный жилой дом, окружённый спокойной городской атмосферой и гармонией с природой. Он расположен по адресу ул. Парнаваз Мепе, 150, рядом с парком «6 мая».",
      ],
    },
    features: { ka: [], en: [], ru: [] },
    soldPercent: 99,
    availability: [
      {
        label: {
          ka: "ტერასა · მე-14 სართული",
          en: "Terrace · floor 14",
          ru: "Терраса · 14 этаж",
        },
        value: "125 m²",
      },
    ],
    mapQuery: "Parnavaz Mepe Street 150, Batumi, Georgia",
    cover: {
      src: "/images/projects/house-on-parnavaz/cover.jpg",
      width: 720,
      height: 800,
      alt: {
        ka: "სახლი ფარნავაზზე — პროექტის ვიზუალიზაცია",
        en: "House on Parnavaz Mepe — project render",
        ru: "Дом на Парнаваза — визуализация проекта",
      },
    },
    listingImage: {
      src: "/images/experimental-ai/house-on-parnavaz-listing.png",
      width: 1448,
      height: 1086,
      alt: {
        ka: "სახლი ფარნავაზზე — დასრულებული შენობის გაუმჯობესებული არქიტექტურული ფოტო",
        en: "House on Parnavaz Mepe — enhanced architectural photograph of the completed building",
        ru: "Дом на Парнаваза — улучшенная архитектурная фотография завершённого здания",
      },
    },
    heroImage: {
      src: "/images/experimental-ai/house-on-parnavaz-hero.png",
      width: 1672,
      height: 941,
      alt: {
        ka: "სახლი ფარნავაზზე — დასრულებული შენობის ფართო, გაუმჯობესებული არქიტექტურული ფოტო",
        en: "House on Parnavaz Mepe — enhanced wide architectural photograph of the completed building",
        ru: "Дом на Парнаваза — улучшенная широкоформатная фотография завершённого здания",
      },
    },
    heroImageMobile: {
      src: "/images/experimental-ai/house-on-parnavaz-hero-mobile.png",
      width: 1122,
      height: 1402,
      alt: {
        ka: "სახლი ფარნავაზზე — დასრულებული შენობის სრული ხედი მობილურისთვის",
        en: "House on Parnavaz Mepe — complete mobile view of the finished building",
        ru: "Дом на Парнаваза — полный мобильный вид завершённого здания",
      },
    },
    gallery: [
      {
        src: "/images/projects/house-on-parnavaz/render.jpg",
        width: 800,
        height: 533,
        alt: {
          ka: "სახლი ფარნავაზზე — პროექტის ვიზუალიზაცია",
          en: "House on Parnavaz Mepe — architectural render",
          ru: "Дом на Парнаваза — архитектурная визуализация",
        },
      },
      {
        src: "/images/projects/house-on-parnavaz/construction.jpg",
        width: 800,
        height: 600,
        alt: {
          ka: "სახლი ფარნავაზზე — მშენებლობის პროცესი",
          en: "House on Parnavaz Mepe during construction",
          ru: "Дом на Парнаваза в процессе строительства",
        },
      },
      {
        src: "/images/projects/house-on-parnavaz/facade.jpg",
        width: 800,
        height: 600,
        alt: {
          ka: "სახლი ფარნავაზზე — დასრულებული ფასადი",
          en: "House on Parnavaz Mepe — completed facade",
          ru: "Дом на Парнаваза — завершённый фасад",
        },
      },
      {
        src: "/images/projects/house-on-parnavaz/context.jpg",
        width: 533,
        height: 800,
        alt: {
          ka: "სახლის ხედი ფარნავაზ მეფის ქუჩიდან",
          en: "View from Parnavaz Mepe Street",
          ru: "Вид с улицы Парнаваз Мепе",
        },
      },
      {
        src: "/images/projects/house-on-parnavaz/street.jpg",
        width: 800,
        height: 533,
        alt: {
          ka: "სახლი ფარნავაზზე — ქუჩის ხედი",
          en: "House on Parnavaz Mepe — street view",
          ru: "Дом на Парнаваза — вид с улицы",
        },
      },
    ],
  },
  {
    slug: "twins",
    accent: "#8FA3B5",
    status: "completed",
    name: { ka: "თვინსი", en: "Twins", ru: "Твинс" },
    city: { ka: "ბათუმი", en: "Batumi", ru: "Батуми" },
    address: {
      ka: "ე. თაყაიშვილის ქ. №51-53",
      en: "E. Takaishvili St. №51-53",
      ru: "ул. Э. Такаишвили №51-53",
    },
    floorsLabel: "2 × 15",
    startYear: 2017,
    endYear: 2020,
    startDate: { ka: "ივნისი 2017", en: "June 2017", ru: "Июнь 2017" },
    endDate: {
      ka: "სექტემბერი 2020",
      en: "September 2020",
      ru: "Сентябрь 2020",
    },
    priceFrom: {
      ka: "1000 $-დან / მ²",
      en: "from $1,000 / m²",
      ru: "от $1000 / м²",
    },
    areasLabel: { ka: "49–52 მ²", en: "49–52 m²", ru: "49–52 м²" },
    summary: {
      ka: "ორი 15-სართულიანი საცხოვრებელი კორპუსი ქალაქის ცენტრალურ ნაწილში — მშენებლობის თანამედროვე სტანდარტებით.",
      en: "Two 15-storey residential towers in the central part of the city, built to modern construction standards.",
      ru: "Два 15-этажных жилых корпуса в центральной части города, отвечающие современным стандартам строительства.",
    },
    description: {
      ka: [
        "„თვინსი“ წარმოადგენს ორ 15-სართულიან საცხოვრებელ კორპუსს, რომელიც მდებარეობს ქალაქის ცენტრალურ ნაწილში და პასუხობს მშენებლობისა და თანამედროვეობის ყველა სტანდარტს.",
        "პროექტი გამოირჩევა ბინების ფართო არჩევანით და საუკეთესო დაგეგმარებით. ყველა ბინა მოიცავს აივანსა და შემოსასვლელს; ბინები პირობითად იყოფა სასტუმრო, საძინებელ და სამეურნეო ზონებად. „თვინსი“ მათთვისაა, ვისაც უნდა, რომ იცხოვროს ქალაქის ცენტრთან ახლოს, მშვიდ გარემოში.",
      ],
      en: [
        "Twins consists of two 15-storey residential towers in the central part of the city, meeting all modern construction standards.",
        "The project stands out for its wide choice of apartments and excellent planning. Every apartment includes a balcony and an entrance hall; layouts are divided into living, bedroom and utility zones. Twins is for those who want to live near the city centre in a calm environment.",
      ],
      ru: [
        "«Твинс» — это два 15-этажных жилых корпуса в центральной части города, отвечающие всем стандартам современного строительства.",
        "Проект отличается большим выбором квартир и удобными планировками. Каждая квартира включает балкон и прихожую; квартиры условно поделены на гостевую, спальную и хозяйственную зоны. «Твинс» — дом для тех, кто хочет жить рядом с центром, в тихой среде.",
      ],
    },
    features: {
      ka: [
        "შავი კარკასი",
        "ბუნებრივი გაზი, წყალი, ელექტროობა, ინტერნეტი, ტელეფონი, საკაბელო ტელევიზია — მიყვანილია ბინამდე",
        "წყლისა და გაზის მრიცხველები",
        "2 მოქმედი ლიფტი",
        "კეთილმოწყობილი ეზო",
        "დასრულებული ფასადი",
        "მეტალოპლასტმასის კარ-ფანჯარა ორმაგი მინაპაკეტით",
        "შესასვლელი რკინის კარი",
        "ანტრესოლი მეორე სართულზე — 188,4-დან 352,1 მ²-მდე",
      ],
      en: [
        "Black frame finish",
        "Natural gas, water, electricity, internet, telephone, cable TV — connected to every apartment",
        "Water and gas meters installed",
        "2 operating elevators",
        "Landscaped yard",
        "Completed facade",
        "PVC doors and windows with double glazing",
        "Iron entrance door",
        "Second-floor mezzanine — 188.4 to 352.1 m²",
      ],
      ru: [
        "Чёрный каркас",
        "Природный газ, вода, электричество, интернет, телефон, кабельное ТВ — подведены до квартиры",
        "Установлены счётчики воды и газа",
        "2 действующих лифта",
        "Обустроенный двор",
        "Завершённый фасад",
        "Металлопластиковые окна и двери с двойным стеклопакетом",
        "Железная входная дверь",
        "Антресоль на втором этаже — от 188,4 до 352,1 м²",
      ],
    },
    soldPercent: 98,
    availability: [
      {
        label: {
          ka: "თავისუფალი ბინა",
          en: "Available apartments",
          ru: "Свободные квартиры",
        },
        value: "1",
      },
      {
        label: {
          ka: "კომერციული ფართი",
          en: "Commercial units",
          ru: "Коммерческие площади",
        },
        value: "2",
      },
      {
        label: { ka: "ტერასა", en: "Terrace", ru: "Терраса" },
        value: "1",
      },
    ],
    mapQuery: "Takaishvili Street 51, Batumi, Georgia",
    cover: {
      src: "/images/experimental-ai/twins-blue-hour.png",
      width: 1401,
      height: 1123,
      alt: {
        ka: "თვინსის გაუმჯობესებული ვიზუალიზაცია ლურჯ საათზე",
        en: "Enhanced blue-hour visualisation of the main Twins tower",
        ru: "Улучшенная визуализация главного корпуса Твинс в синий час",
      },
    },
    listingImage: {
      src: "/images/projects/twins/aerial-day.jpg",
      width: 1920,
      height: 1080,
      alt: {
        ka: "თვინსის ორივე კორპუსი — ხედი ზემოდან, დღისით",
        en: "Both Twins towers — aerial view by day",
        ru: "Оба корпуса Твинс — вид с воздуха днём",
      },
    },
    gallery: [
      {
        src: "/images/experimental-ai/twins-blue-hour.png",
        width: 1401,
        height: 1123,
        alt: {
          ka: "თვინსი — გაუმჯობესებული ვიზუალიზაცია ლურჯ საათზე",
          en: "Twins — enhanced blue-hour visualisation",
          ru: "Твинс — улучшенная визуализация в синий час",
        },
      },
      {
        src: "/images/projects/twins/cover.jpg",
        width: 1920,
        height: 1543,
        alt: {
          ka: "თვინსის მთავარი კორპუსი",
          en: "Main Twins tower",
          ru: "Главный корпус Твинс",
        },
      },
      {
        src: "/images/projects/twins/aerial-day.jpg",
        width: 1920,
        height: 1080,
        alt: {
          ka: "თვინსი — ხედი ზემოდან, დღისით",
          en: "Twins — aerial view by day",
          ru: "Твинс — вид сверху днём",
        },
      },
      {
        src: "/images/projects/twins/aerial-night.jpg",
        width: 1920,
        height: 1080,
        alt: {
          ka: "თვინსი — ხედი ზემოდან, ღამით",
          en: "Twins — aerial view at night",
          ru: "Твинс — вид сверху ночью",
        },
      },
    ],
    floorplans: [
      {
        src: "/images/floorplans/twins/floor-02.jpg",
        width: 1768,
        height: 1181,
        alt: {
          ka: "თვინსი — მე-2 სართულის გეგმა",
          en: "Twins — floor 2 plan",
          ru: "Твинс — план 2 этажа",
        },
      },
      {
        src: "/images/floorplans/twins/floor-04.jpg",
        width: 1768,
        height: 1181,
        alt: {
          ka: "თვინსი — მე-4 სართულის გეგმა",
          en: "Twins — floor 4 plan",
          ru: "Твинс — план 4 этажа",
        },
      },
      {
        src: "/images/floorplans/twins/commercial-floor.jpg",
        width: 1866,
        height: 1198,
        alt: {
          ka: "თვინსი — კომერციული სართულის გეგმა",
          en: "Twins — commercial floor plan",
          ru: "Твинс — план коммерческого этажа",
        },
      },
    ],
  },
  {
    slug: "grand-house-tbilisi",
    accent: "#9C7B52",
    status: "completed",
    name: {
      ka: "გრანდ ჰაუსი თბილისი",
      en: "Grand House Tbilisi",
      ru: "Гранд Хаус Тбилиси",
    },
    city: { ka: "თბილისი", en: "Tbilisi", ru: "Тбилиси" },
    address: {
      ka: "საბურთალო, ვ. დოლიძის ქ. №24",
      en: "Saburtalo, V. Dolidze St. №24",
      ru: "Сабуртало, ул. В. Долидзе №24",
    },
    floorsLabel: "15",
    startYear: 2015,
    endYear: 2020,
    startDate: {
      ka: "თებერვალი 2015",
      en: "February 2015",
      ru: "Февраль 2015",
    },
    endDate: { ka: "მაისი 2020", en: "May 2020", ru: "Май 2020" },
    summary: {
      ka: "15-სართულიანი ელიტარული საცხოვრებელი კომპლექსი თბილისის ცენტრში, ორსართულიანი მიწისქვეშა პარკინგით 38 ავტომობილზე.",
      en: "A 15-storey luxury residential complex in central Tbilisi with a two-level underground car park for 38 cars.",
      ru: "15-этажный элитный жилой комплекс в центре Тбилиси с двухуровневым подземным паркингом на 38 машиномест.",
    },
    description: {
      ka: [
        "15-სართულიანი ელიტარული საცხოვრებელი კომპლექსი თბილისის ცენტრში, საბურთალოს რაიონში, დოლიძის ქუჩა №24-ში — ორსართულიანი მიწისქვეშა პარკინგით, რომელიც გათვლილია 38 ავტომობილზე.",
        "სახლის მიმდებარე ტერიტორიაზე განლაგებულია: თამარ მეფის სახელობის ტაძარი, საბავშვო ბაღები, სკოლები, ბანკების განყოფილებები, სასტუმრო Holiday Inn, სავაჭრო და გასართობი ცენტრები, ბრენდული მაღაზიები, კაფე-ბარები, ავტობუსებისა და სამარშრუტო ტაქსების გაჩერებები.",
      ],
      en: [
        "A 15-storey luxury residential complex in the centre of Tbilisi, in the Saburtalo district at 24 Dolidze Street — with a two-level underground car park for 38 cars.",
        "The surrounding area offers the Queen Tamar cathedral, kindergartens, schools, bank branches, the Holiday Inn hotel, shopping and entertainment centres, brand stores, cafés and bars, and bus and minibus stops.",
      ],
      ru: [
        "15-этажный элитный жилой комплекс в центре Тбилиси, в районе Сабуртало, на улице Долидзе №24 — с двухуровневым подземным паркингом на 38 машиномест.",
        "Рядом с домом расположены: собор имени царицы Тамары, детские сады, школы, отделения банков, отель Holiday Inn, торговые и развлекательные центры, брендовые магазины, кафе-бары, остановки автобусов и маршрутных такси.",
      ],
    },
    features: {
      ka: [
        "თავისუფალი გეგმარება",
        "თეთრი კარკასი",
        "მიწისქვეშა ავტოსადგომი",
        "ბუნებრივი გაზი, წყალი, ელექტროობა, ინტერნეტი, ტელეფონი, საკაბელო ტელევიზია — მიყვანილია ბინამდე",
        "წყლისა და გაზის მრიცხველები",
        "ლიფტი",
        "კეთილმოწყობილი ეზო",
        "დასრულებული ფასადი",
        "მეტალოპლასტმასის კარ-ფანჯარა ორმაგი მინაპაკეტით",
        "შესასვლელი რკინის კარი",
        "ჭერის სიმაღლე — 3 მ",
        "კომერციული ფართები პირველ სართულზე",
      ],
      en: [
        "Open floor plans",
        "White frame finish",
        "Underground parking",
        "Natural gas, water, electricity, internet, telephone, cable TV — connected to every apartment",
        "Water and gas meters installed",
        "Elevator",
        "Landscaped yard",
        "Completed facade",
        "PVC doors and windows with double glazing",
        "Iron entrance door",
        "Ceiling height — 3 m",
        "Ground-floor commercial premises",
      ],
      ru: [
        "Свободная планировка",
        "Белый каркас",
        "Подземный паркинг",
        "Природный газ, вода, электричество, интернет, телефон, кабельное ТВ — подведены до квартиры",
        "Установлены счётчики воды и газа",
        "Лифт",
        "Обустроенный двор",
        "Завершённый фасад",
        "Металлопластиковые окна и двери с двойным стеклопакетом",
        "Железная входная дверь",
        "Высота потолков — 3 м",
        "Первый этаж — коммерческие помещения",
      ],
    },
    soldPercent: 94,
    availability: [
      {
        label: {
          ka: "თავისუფალი პარკინგი",
          en: "Available parking spaces",
          ru: "Свободные места паркинга",
        },
        value: "6",
      },
    ],
    mapQuery: "Dolidze Street 24, Tbilisi, Georgia",
    cover: {
      src: "/images/projects/grand-house/cover.jpg",
      width: 2048,
      height: 1365,
      alt: {
        ka: "გრანდ ჰაუსი თბილისი — პროექტის ვიზუალიზაცია",
        en: "Grand House Tbilisi — project render",
        ru: "Гранд Хаус Тбилиси — визуализация проекта",
      },
    },
    gallery: [
      {
        src: "/images/projects/grand-house/cover.jpg",
        width: 2048,
        height: 1365,
        alt: {
          ka: "გრანდ ჰაუსი თბილისი",
          en: "Grand House Tbilisi",
          ru: "Гранд Хаус Тбилиси",
        },
      },
      {
        src: "/images/projects/grand-house/render.jpg",
        width: 1548,
        height: 2048,
        alt: {
          ka: "გრანდ ჰაუსის პროექტის ვიზუალიზაცია",
          en: "Grand House project render",
          ru: "Визуализация проекта Гранд Хаус",
        },
      },
      {
        src: "/images/projects/grand-house/facade.jpg",
        width: 1365,
        height: 2048,
        alt: {
          ka: "გრანდ ჰაუსის ფასადი",
          en: "Grand House facade",
          ru: "Фасад Гранд Хаус",
        },
      },
      {
        src: "/images/projects/grand-house/detail.jpg",
        width: 1000,
        height: 1058,
        alt: {
          ka: "ფასადის დეტალი — აივნები",
          en: "Facade detail — balconies",
          ru: "Деталь фасада — балконы",
        },
      },
      {
        src: "/images/projects/grand-house/construction.jpg",
        width: 2060,
        height: 1977,
        alt: {
          ka: "მშენებლობის პროცესი",
          en: "Construction in progress",
          ru: "Процесс строительства",
        },
      },
    ],
  },
  {
    slug: "red-line",
    accent: "#C0392E",
    status: "completed",
    name: { ka: "რედ ლაინი", en: "Red Line", ru: "Ред Лайн" },
    city: { ka: "ბათუმი", en: "Batumi", ru: "Батуми" },
    address: {
      ka: "ი. ჭავჭავაძის ქ. №107/39",
      en: "I. Chavchavadze St. №107/39",
      ru: "ул. И. Чавчавадзе №107/39",
    },
    floorsLabel: "15",
    startYear: 2014,
    endYear: 2017,
    startDate: { ka: "აგვისტო 2014", en: "August 2014", ru: "Август 2014" },
    endDate: { ka: "ივლისი 2017", en: "July 2017", ru: "Июль 2017" },
    areasLabel: {
      ka: "67,3 მ²-დან",
      en: "from 67.3 m²",
      ru: "от 67,3 м²",
    },
    summary: {
      ka: "15-სართულიანი საცხოვრებელი სახლი ხარისხიანი, თანამედროვე ფასადითა და ბინების ფართო არჩევანით.",
      en: "A 15-storey residential building with a striking modern facade and a wide choice of apartments.",
      ru: "15-этажный жилой дом с качественным современным фасадом и большим выбором квартир.",
    },
    description: {
      ka: [
        "„რედ ლაინი“ — 15-სართულიანი საცხოვრებელი სახლია ჭავჭავაძის ქ. №107-ში, რომელიც გამოირჩევა ხარისხიანი, თანამედროვე ფასადითა და ბინების ფართო არჩევანით.",
        "ყველა ბინა მოიცავს აივანსა და შემოსასვლელს; ბინები პირობითად იყოფა სასტუმრო, საძინებელ და სამეურნეო ზონებად.",
      ],
      en: [
        "Red Line is a 15-storey residential building at 107 Chavchavadze Street, distinguished by its high-quality modern facade, high-grade utilities and spacious apartments.",
        "Every apartment includes a balcony and a hall; layouts are divided into living, bedroom and utility zones. Combining comfort and innovation, Red Line is the right choice for quality housing at a reasonable price.",
      ],
      ru: [
        "«Ред Лайн» — современный жилой комплекс класса «комфорт»: двухподъездное здание высотой 15 этажей с современным фасадом, качественными коммуникациями и просторными квартирами.",
        "Каждая квартира включает балкон и прихожую; квартиры условно поделены на гостевую, спальную и хозяйственную зоны.",
      ],
    },
    features: {
      ka: [
        "შავი კარკასი",
        "მიწისქვეშა ავტოსადგომი",
        "ბუნებრივი გაზი, წყალი, ელექტროობა, ინტერნეტი, ტელეფონი, საკაბელო ტელევიზია — მიყვანილია ბინამდე",
        "წყლისა და გაზის მრიცხველები",
        "2 სადარბაზო",
        "2 მოქმედი ლიფტი",
        "კეთილმოწყობილი ეზო",
        "დასრულებული ფასადი",
        "მეტალოპლასტმასის კარ-ფანჯარა ორმაგი მინაპაკეტით",
        "შესასვლელი რკინის კარი",
        "კომერციული ფართები პირველ სართულზე",
      ],
      en: [
        "Black frame finish",
        "Underground parking",
        "Natural gas, water, electricity, internet, telephone, cable TV — connected to every apartment",
        "Water and gas meters installed",
        "2 entrances",
        "2 operating elevators",
        "Landscaped yard",
        "Completed facade",
        "PVC doors and windows with double glazing",
        "Iron entrance door",
        "Ground-floor commercial premises",
      ],
      ru: [
        "Чёрный каркас",
        "Подземный паркинг",
        "Природный газ, вода, электричество, интернет, телефон, кабельное ТВ — подведены до квартиры",
        "Установлены счётчики воды и газа",
        "2 подъезда",
        "2 действующих лифта",
        "Обустроенный двор",
        "Завершённый фасад",
        "Металлопластиковые окна и двери с двойным стеклопакетом",
        "Железная входная дверь",
        "Первый этаж — коммерческие помещения",
      ],
    },
    soldPercent: 96,
    availability: [
      {
        label: {
          ka: "თავისუფალი ბინა",
          en: "Available apartments",
          ru: "Свободные квартиры",
        },
        value: "4",
      },
      {
        label: {
          ka: "თავისუფალი პარკინგი",
          en: "Available parking spaces",
          ru: "Свободные места паркинга",
        },
        value: "4",
      },
      {
        label: { ka: "ტერასა", en: "Terraces", ru: "Террасы" },
        value: "2",
      },
    ],
    mapQuery: "Chavchavadze Street 107, Batumi, Georgia",
    cover: {
      src: "/images/projects/red-line/cover.jpg",
      width: 800,
      height: 742,
      alt: {
        ka: "რედ ლაინი საღამოს ქუჩის ხედით",
        en: "Red Line at dusk, street view",
        ru: "Ред Лайн вечером, вид с улицы",
      },
    },
    listingImage: {
      src: "/images/experimental-ai/red-line-listing.png",
      width: 1302,
      height: 1208,
      alt: {
        ka: "რედ ლაინი — გაუმჯობესებული არქიტექტურული ვიზუალიზაცია",
        en: "Red Line — enhanced architectural visualisation",
        ru: "Ред Лайн — улучшенная архитектурная визуализация",
      },
    },
    heroImage: {
      src: "/images/experimental-ai/red-line-hero.png",
      width: 1672,
      height: 941,
      alt: {
        ka: "რედ ლაინი — ფართო, გაუმჯობესებული არქიტექტურული ვიზუალიზაცია",
        en: "Red Line — enhanced wide architectural visualisation",
        ru: "Ред Лайн — улучшенная широкоформатная архитектурная визуализация",
      },
    },
    gallery: [
      {
        src: "/images/projects/red-line/render.jpg",
        width: 1600,
        height: 2000,
        alt: {
          ka: "რედ ლაინის პროექტის ვიზუალიზაცია",
          en: "Red Line project render",
          ru: "Визуализация проекта Ред Лайн",
        },
      },
      {
        src: "/images/projects/red-line/cover.jpg",
        width: 800,
        height: 742,
        alt: {
          ka: "რედ ლაინი ქუჩის ხედით",
          en: "Red Line street view",
          ru: "Ред Лайн, вид с улицы",
        },
      },
      {
        src: "/images/projects/red-line/facade.jpg",
        width: 1228,
        height: 2048,
        alt: {
          ka: "რედ ლაინის ფასადი",
          en: "Red Line facade",
          ru: "Фасад Ред Лайн",
        },
      },
      {
        src: "/images/projects/red-line/street.jpg",
        width: 800,
        height: 1333,
        alt: {
          ka: "რედ ლაინი — ხედი ეზოდან",
          en: "Red Line — view from the yard",
          ru: "Ред Лайн — вид со двора",
        },
      },
    ],
    floorplans: [
      {
        src: "/images/floorplans/red-line/floor-08.jpg",
        width: 1920,
        height: 1070,
        alt: {
          ka: "რედ ლაინი — მე-8 სართულის გეგმა",
          en: "Red Line — floor 8 plan",
          ru: "Ред Лайн — план 8 этажа",
        },
      },
      {
        src: "/images/floorplans/red-line/floor-12.jpg",
        width: 1920,
        height: 1070,
        alt: {
          ka: "რედ ლაინი — მე-12 სართულის გეგმა",
          en: "Red Line — floor 12 plan",
          ru: "Ред Лайн — план 12 этажа",
        },
      },
      {
        src: "/images/floorplans/red-line/floor-14.jpg",
        width: 1920,
        height: 1070,
        alt: {
          ka: "რედ ლაინი — მე-14 სართულის გეგმა",
          en: "Red Line — floor 14 plan",
          ru: "Ред Лайн — план 14 этажа",
        },
      },
    ],
  },
];

export function getProject(slug: string): Project | undefined {
  return PROJECTS.find((project) => project.slug === slug);
}

export const FEATURED_PROJECT = PROJECTS[0];

/** "2022–2024", or the localized "TBA" label while dates are unconfirmed. */
export function projectPeriod(project: Project, tba: string): string {
  if (project.startYear && project.endYear) {
    return `${project.startYear}–${project.endYear}`;
  }
  return project.startYear ? `${project.startYear}–${tba}` : tba;
}

export function projectFloors(project: Project, tba: string): string {
  return project.floorsLabel ?? tba;
}

export function projectDate(
  date: Project["startDate"],
  lang: Lang,
  tba: string,
): string {
  return date?.[lang] ?? tba;
}
