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
  readonly pricePerSqm?: number;
}

export interface ProjectInventoryFloor {
  readonly id: string;
  readonly label: Localized;
  readonly image: SiteImage;
  readonly units: readonly ProjectInventoryUnit[];
}

export interface ProjectInventory {
  readonly sourceHref: string;
  readonly sourceName: string;
  readonly planRevision: string;
  readonly floors: readonly ProjectInventoryFloor[];
}

export interface Project {
  readonly slug: string;
  readonly accent: string;
  readonly status: ProjectStatus;
  readonly name: Localized;
  readonly city: Localized;
  readonly address: Localized;
  readonly floorsLabel: string;
  readonly startYear: number;
  readonly endYear: number;
  readonly startDate: Localized;
  readonly endDate: Localized;
  readonly priceFrom?: Localized;
  readonly areasLabel?: Localized;
  readonly summary: Localized;
  readonly description: LocalizedList;
  readonly features: LocalizedList;
  readonly soldPercent?: number;
  readonly availability: readonly AvailabilityItem[];
  readonly inventory?: ProjectInventory;
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
