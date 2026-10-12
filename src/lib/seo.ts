import type { Metadata } from "next";
import type { Project, SiteImage } from "./types";
import { CONTACT, COMPANY_NAME } from "./site";
import { LANGS, type Lang, type Localized } from "./types";

export const SITE_URL = "https://www.comfortbuilding.ge";
// Manually maintained: the shared business/project graph changed on this date.
// Do not replace this with the build date or imply refreshed inventory.
export const SITE_UPDATED_AT = new Date("2026-10-12T00:00:00+04:00");
export const BUYING_GUIDE_PUBLISHED_AT = new Date("2026-08-21T00:00:00+04:00");

export const HOME_DESCRIPTIONS: Localized = {
  ka: "კომფორტ ბილდინგი — სამშენებლო კომპანია ბათუმში. გაეცანით მიმდინარე და დასრულებულ საცხოვრებელ პროექტებს, ბინების გეგმებს, ფასებს, ხელმისაწვდომობასა და პირდაპირ საკონტაქტო ინფორმაციას.",
  en: "Comfort Building is a residential developer in Batumi, Georgia. Explore current and completed projects, apartment plans, prices, availability, and direct contact details.",
  ru: "Comfort Building — строительная компания в Батуми, Грузия. Смотрите текущие и завершённые проекты, планировки, цены, наличие квартир и прямые контакты.",
};

const OG_LOCALES: Record<Lang, string> = {
  ka: "ka_GE",
  en: "en_US",
  ru: "ru_RU",
};

export const LEGAL_NAMES: Localized = {
  ka: "შპს „კომფორტ ბილდინგი“",
  en: "LLC Comfort Building",
  ru: "ООО «Комфорт Билдинг»",
};

const OFFICE_STREETS: Localized = {
  ka: "ე. თაყაიშვილის ქ. №51-53",
  en: "51-53 E. Takaishvili St.",
  ru: "ул. Э. Такаишвили №51-53",
};

const BATUMI: Localized = { ka: "ბათუმი", en: "Batumi", ru: "Батуми" };

export function absoluteUrl(path = ""): string {
  return new URL(path, SITE_URL).toString();
}

export function pagePath(lang: Lang, suffix = ""): string {
  return `/${lang}${suffix}`;
}

export function languageAlternates(
  lang: Lang,
  suffix = "",
): Metadata["alternates"] {
  const languages = Object.fromEntries(
    LANGS.map((code) => [code, absoluteUrl(pagePath(code, suffix))]),
  );

  return {
    canonical: absoluteUrl(pagePath(lang, suffix)),
    languages: {
      ...languages,
      "x-default": absoluteUrl(pagePath("ka", suffix)),
    },
  };
}

interface PageMetadataOptions {
  readonly lang: Lang;
  readonly title: string;
  readonly description: string;
  readonly suffix?: string;
  readonly image: SiteImage;
}

export function pageMetadata({
  lang,
  title,
  description,
  suffix = "",
  image,
}: PageMetadataOptions): Metadata {
  const url = absoluteUrl(pagePath(lang, suffix));
  const imageUrl = absoluteUrl(image.src);

  return {
    title,
    description,
    alternates: languageAlternates(lang, suffix),
    openGraph: {
      type: "website",
      url,
      siteName: COMPANY_NAME[lang],
      title,
      description,
      locale: OG_LOCALES[lang],
      alternateLocale: LANGS.filter((code) => code !== lang).map(
        (code) => OG_LOCALES[code],
      ),
      images: [
        {
          url: imageUrl,
          width: image.width,
          height: image.height,
          alt: image.alt[lang],
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [{ url: imageUrl, alt: image.alt[lang] }],
    },
  };
}

export function organizationJsonLd(lang: Lang) {
  return {
    "@type": ["Organization", "GeneralContractor"],
    "@id": `${SITE_URL}/#organization`,
    name: COMPANY_NAME[lang],
    alternateName: ["Comfort Building", "კომფორტ ბილდინგი"],
    legalName: LEGAL_NAMES[lang],
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl("/images/logo-mark.png"),
      contentUrl: absoluteUrl("/images/logo-mark.png"),
      width: 512,
      height: 512,
    },
    image: absoluteUrl("/images/projects/comfort-house/facade.jpg"),
    description: HOME_DESCRIPTIONS[lang],
    telephone: CONTACT.phoneDisplay,
    email: CONTACT.email,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "sales",
      telephone: CONTACT.phoneDisplay,
      email: CONTACT.email,
      availableLanguage: ["Georgian", "English", "Russian"],
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: OFFICE_STREETS[lang],
      addressLocality: BATUMI[lang],
      addressRegion: "Adjara",
      addressCountry: "GE",
    },
    areaServed: [
      { "@type": "City", name: "Batumi" },
      { "@type": "City", name: "Tbilisi" },
    ],
    hasMap: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(CONTACT.mapQuery)}`,
    sameAs: [CONTACT.facebook, CONTACT.instagram],
  };
}

export function websiteJsonLd(lang: Lang) {
  return {
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: "Comfort Building",
    alternateName: COMPANY_NAME[lang],
    inLanguage: LANGS,
    publisher: { "@id": `${SITE_URL}/#organization` },
  };
}

export function webPageJsonLd(
  lang: Lang,
  suffix: string,
  name: string,
  description: string,
  type = "WebPage",
) {
  const url = absoluteUrl(pagePath(lang, suffix));
  return {
    "@type": type,
    "@id": `${url}#webpage`,
    url,
    name,
    description,
    inLanguage: lang,
    isPartOf: { "@id": `${SITE_URL}/#website` },
    about: { "@id": `${SITE_URL}/#organization` },
  };
}

export interface BreadcrumbItem {
  readonly name: string;
  readonly path: string;
}

export function breadcrumbJsonLd(items: readonly BreadcrumbItem[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function projectJsonLd(project: Project, lang: Lang) {
  const url = absoluteUrl(pagePath(lang, `/projects/${project.slug}`));
  const images = Array.from(
    new Set(
      [
        project.heroImage?.src,
        project.listingImage?.src,
        project.cover.src,
        ...project.gallery.map((image) => image.src),
      ].filter((source): source is string => Boolean(source)),
    ),
  ).map(absoluteUrl);
  const floorPlans = project.inventory?.floors.flatMap((floor) => {
    const apartments = floor.units.filter((unit) => unit.kind === "apartment");
    if (apartments.length === 0) return [];

    return [
      {
        "@type": "FloorPlan",
        name: floor.label[lang],
        layoutImage: absoluteUrl(floor.image.src),
        numberOfAccommodationUnits: apartments.length,
        numberOfAvailableAccommodationUnits: apartments.filter(
          (unit) => unit.status === "available",
        ).length,
      },
    ];
  });

  return {
    "@type": "ApartmentComplex",
    "@id": `${url}#project`,
    name: project.name[lang],
    description: project.summary[lang],
    url,
    mainEntityOfPage: { "@id": `${url}#webpage` },
    image: images,
    address: {
      "@type": "PostalAddress",
      streetAddress: project.address[lang],
      addressLocality: project.city[lang],
      addressCountry: "GE",
    },
    ...(project.status === "completed" ? { yearBuilt: project.endYear } : {}),
    telephone: CONTACT.phoneDisplay,
    amenityFeature: project.features[lang].map((feature) => ({
      "@type": "LocationFeatureSpecification",
      name: feature,
      value: true,
    })),
    ...(floorPlans && floorPlans.length > 0
      ? { accommodationFloorPlan: floorPlans }
      : {}),
  };
}

export function jsonLdGraph(nodes: readonly Record<string, unknown>[]) {
  return { "@context": "https://schema.org", "@graph": nodes };
}
