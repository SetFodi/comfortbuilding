/** Coordinates follow the supplied plan board: x left-to-right, y top-to-bottom. */
export type PlanPoint = readonly [number, number];

export type FurnitureKind =
  | "bed"
  | "sofa"
  | "table"
  | "chair"
  | "kitchen"
  | "wardrobe"
  | "shower"
  | "bathtub"
  | "toilet"
  | "vanity"
  | "plant";

export interface PlanFurniture {
  readonly kind: FurnitureKind;
  /** Normalized top-left, width and depth within the plan crop. */
  readonly rect: readonly [number, number, number, number];
  readonly rotation?: number;
}

export interface ApartmentModel {
  readonly id: string;
  readonly area: number;
  readonly bedrooms: number;
  readonly source: {
    readonly src: string;
    readonly width: number;
    readonly height: number;
    /** Plan-only bounds in source-image pixels. */
    readonly crop: readonly [number, number, number, number];
  };
  readonly footprint: readonly PlanPoint[];
  readonly walls: readonly (readonly [PlanPoint, PlanPoint])[];
  readonly furniture: readonly PlanFurniture[];
  readonly viewpoints: readonly {
    readonly id: "living" | "bedroom" | "bedroom2" | "kitchen";
    readonly position: PlanPoint;
    readonly target: PlanPoint;
  }[];
}
