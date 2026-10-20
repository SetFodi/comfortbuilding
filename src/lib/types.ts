export const LANGS = ["ka", "en", "ru"] as const;

export type Lang = (typeof LANGS)[number];

export type Localized = Readonly<Record<Lang, string>>;

export type LocalizedList = Readonly<Record<Lang, readonly string[]>>;

export interface SiteImage {
  readonly src: string;
  readonly width: number;
  readonly height: number;
  readonly alt: Localized;
}

export type ProjectStatus = "ongoing" | "completed";

export interface AvailabilityItem {
  readonly label: Localized;
  readonly value: string;
}

export type InventoryStatus = "available" | "sold";

export type InventoryUnitKind =
  "apartment" | "commercial" | "parking" | "terrace";

export interface ProjectInventoryUnit {
  readonly id: string;
  readonly kind: InventoryUnitKind;
  readonly number?: string;
  readonly label?: Localized;
  readonly interiorArea?: number;
  readonly balconyArea?: number;
  readonly totalArea: number;
  readonly status: InventoryStatus;
}

export interface ProjectInventoryFloor {
  readonly id: string;
  readonly label: Localized;
  readonly units: readonly ProjectInventoryUnit[];
}

export interface ProjectInventory {
  readonly floors: readonly ProjectInventoryFloor[];
}

export interface FaqItem {
  readonly question: string;
  readonly answer: string;
}

/** An apartment still for sale, as listed on the sales team's price sheet. */
export interface PricedUnit {
  readonly number: string;
  readonly floor: number;
  readonly totalArea: number;
  readonly pricePerSqm: number;
}

export interface ProjectPriceList {
  /** When the sales team published these prices. */
  readonly asOf: Localized;
  readonly currency: "USD";
  readonly units: readonly PricedUnit[];
  readonly parking?: {
    readonly price: number;
    readonly available: number;
    readonly total: number;
  };
  readonly notForSaleFloors?: readonly number[];
}

/** A published apartment type: its area, bedrooms and layout board. */
export interface ApartmentLayout {
  readonly id: string;
  readonly totalArea: number;
  readonly bedrooms: number;
  readonly image: SiteImage;
}

export interface Project {
  readonly slug: string;
  readonly accent: string;
  readonly status: ProjectStatus;
  readonly name: Localized;
  readonly city: Localized;
  readonly address: Localized;
  /** Omitted until confirmed; pages show "TBA" instead. */
  readonly floorsLabel?: string;
  readonly startYear?: number;
  readonly endYear?: number;
  readonly startDate?: Localized;
  readonly endDate?: Localized;
  readonly priceFrom?: Localized;
  /** Hides published prices in favour of call and email actions. */
  readonly priceOnRequest?: boolean;
  readonly areasLabel?: Localized;
  readonly summary: Localized;
  readonly description: LocalizedList;
  readonly features: LocalizedList;
  readonly soldPercent?: number;
  readonly availability: readonly AvailabilityItem[];
  readonly inventory?: ProjectInventory;
  readonly layouts?: readonly ApartmentLayout[];
  readonly priceList?: ProjectPriceList;
  /** Buyer questions shown on the project page and as FAQPage data. */
  readonly faqs?: Readonly<Record<Lang, readonly FaqItem[]>>;
  readonly mapQuery: string;
  readonly cover: SiteImage;
  readonly listingImage?: SiteImage;
  readonly heroImage?: SiteImage;
  readonly heroImageMobile?: SiteImage;
  readonly gallery: readonly SiteImage[];
  readonly floorplans?: readonly SiteImage[];
}

export function isLang(value: string): value is Lang {
  return (LANGS as readonly string[]).includes(value);
}
