/** Coordinates follow the supplied plan board: x left-to-right, y top-to-bottom. */
export type PlanPoint = readonly [number, number];

export type FurnitureKind =
  | "bed"
  | "sofa"
  | "table"
  | "dining"
  | "chair"
  | "armchair"
  | "sideTable"
  | "nightstand"
  | "kitchen"
  | "fridge"
  | "wardrobe"
  | "media"
  | "console"
  | "shelving"
  | "rug"
  | "shower"
  | "bathtub"
  | "toilet"
  | "vanity"
  | "plant"
  /** A boxed-in cistern or bathroom niche shelf, about a metre high. */
  | "ledge";

export interface PlanFurniture {
  readonly kind: FurnitureKind;
  /** Normalized top-left, width and depth within the plan crop. */
  readonly rect: readonly [number, number, number, number];
  readonly rotation?: number;
  /** Round rugs, nightstands, and quarter-round corner showers. */
  readonly shape?: "round";
  /**
   * Where a kitchen run's hob and sink sit, as offsets along its length from
   * the centre (-0.5 is the left end facing it, 0.5 the right); null for none.
   */
  readonly fittings?: { readonly hob: number | null; readonly sink: number | null };
}

/**
 * A gap in a wall. Doors swing towards `swing` (+1 is the positive normal of
 * the from→to direction); windows keep a sill and lintel around the glass.
 * `balcony` is a glazed door you can walk through; `glazing` is fixed
 * floor-to-ceiling glass.
 */
export interface PlanOpening {
  readonly kind: "door" | "entrance" | "balcony" | "window" | "glazing";
  readonly from: PlanPoint;
  readonly to: PlanPoint;
  readonly hinge?: "from" | "to";
  readonly swing?: 1 | -1;
  /** Two leaves, one hung at each jamb. */
  readonly leaves?: 2;
}

/** Floor finishes that differ from the oak used everywhere else. */
export interface PlanFloor {
  readonly kind: "tile" | "balcony";
  readonly rect: readonly [number, number, number, number];
}

/** Board pixel → metre control points along one axis, ascending in pixels. */
export type AxisCalibration = readonly (readonly [number, number])[];

/**
 * Board pixels are mapped to real metres measured on the architectural floor
 * plan. AI-generated concept boards are not drawn to scale, so each zone can
 * correct its rooms separately. The first zone containing a point wins.
 */
export interface CalibrationZone {
  /** Board-pixel bounds [left, top, right, bottom]; omitted means everywhere. */
  readonly within?: readonly [number, number, number, number];
  readonly x: AxisCalibration;
  readonly z: AxisCalibration;
}

/**
 * Extra metres of floor inserted at board pixels along each axis. Used only
 * by the 3D views to open up walkways; furniture keeps its real size and the
 * published areas are unaffected.
 */
export interface PlanWidening {
  readonly x?: readonly (readonly [number, number])[];
  readonly z?: readonly (readonly [number, number])[];
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
  /** Metres covered by the normalized 0–1 plan coordinates. */
  readonly size: { readonly width: number; readonly depth: number };
  /** Plan metres at the normalized (0, 0) corner. */
  readonly origin: { readonly x: number; readonly z: number };
  readonly calibration: readonly CalibrationZone[];
  readonly widen?: PlanWidening;
  readonly footprint: readonly PlanPoint[];
  readonly walls: readonly (readonly [PlanPoint, PlanPoint])[];
  readonly openings: readonly PlanOpening[];
  /** Structural columns as normalized [left, top, width, depth] rectangles. */
  readonly columns?: readonly (readonly [number, number, number, number])[];
  readonly floors: readonly PlanFloor[];
  readonly furniture: readonly PlanFurniture[];
  readonly viewpoints: readonly {
    readonly id: "living" | "bedroom" | "bedroom2" | "kitchen";
    readonly position: PlanPoint;
    readonly target: PlanPoint;
  }[];
}
