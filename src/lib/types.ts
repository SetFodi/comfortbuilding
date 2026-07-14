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
  readonly mapQuery: string;
  readonly cover: SiteImage;
  readonly listingImage?: SiteImage;
  readonly gallery: readonly SiteImage[];
  readonly floorplans?: readonly SiteImage[];
}

export function isLang(value: string): value is Lang {
  return (LANGS as readonly string[]).includes(value);
}
