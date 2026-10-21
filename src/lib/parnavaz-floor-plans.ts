import { PARNAVAZ_FACADE_FLOORS } from "./parnavaz-facade";

/**
 * Floor plans II–VIII from the sales team's sheet "ქალაქი ბათუმი, ფარნავაზ
 * მეფის ქუჩა #65.pdf" (pages 10–16). Each page was aligned on the lift core,
 * cropped to one common frame and cleaned of its sold stamps, prices and
 * colour fills, so the images only show the drawing. Unit outlines are traced
 * in that frame's pixels (1595 × 587, about 35.8 px per metre); availability
 * always comes from the price list, never from the drawing.
 */
export const PARNAVAZ_PLAN = { width: 1595, height: 587, pxPerMetre: 35.8 } as const;

type Points = readonly (readonly [number, number])[];

export interface PlanUnit {
  /** Apartment number, when the drawing names it. */
  readonly number?: string;
  readonly points: Points;
  /**
   * Where the unit meets the two faces the building render shows. `short` is
   * a plan-y range on the left end, `long` a plan-x range on the street side.
   * Units on the courtyard side have neither.
   */
  readonly facade?: { readonly short?: readonly [number, number]; readonly long?: readonly [number, number] };
}

export interface FloorPlan {
  readonly floor: number;
  readonly image: { readonly src: string; readonly width: number; readonly height: number };
  readonly units: readonly PlanUnit[];
}

// Shapes repeated on several floors. The street side is the bottom of the
// plan and the left end of the plan is the building's short visible face.
const CORNER_117: Points = [[12, 100], [289, 100], [289, 74], [462, 74], [462, 100], [550, 100], [550, 196], [500, 196], [500, 256], [278, 256], [278, 555], [35, 555], [35, 300], [12, 300]];
const MIDDLE_55: Points = [[278, 256], [575, 256], [575, 302], [508, 302], [508, 572], [278, 572]];
const MIDDLE_50: Points = [[575, 256], [732, 256], [732, 572], [508, 572], [508, 302], [575, 302]];
const MIDDLE_76: Points = [[737, 298], [1120, 298], [1120, 572], [737, 572]];
const SMALL_LEFT: Points = [[737, 298], [897, 298], [897, 572], [737, 572]];
const SMALL_RIGHT: Points = [[897, 298], [1120, 298], [1120, 572], [897, 572]];
const RIGHT_46: Points = [[1122, 298], [1349, 298], [1349, 572], [1122, 572]];
const END_45: Points = [[1352, 298], [1580, 298], [1580, 572], [1352, 572]];
const REAR_55: Points = [[900, 37], [1240, 37], [1240, 237], [900, 237]];
const REAR_39: Points = [[1355, 37], [1577, 37], [1577, 290], [1412, 290], [1412, 240], [1355, 240]];
/** The upper-left unit of floors II–IV ends lower on each floor. */
const upperLeft = (bottom: number): Points => [
  [12, 100], [289, 100], [289, 74], [462, 74], [462, 100], [510, 100], [510, 256], [278, 256],
  [278, bottom], ...(bottom > 300 ? [[60, bottom], [60, 300]] as const : []), [12, 300],
];

const corner117 = { short: [100, 555], long: [60, 278] } as const;
const front = (from: number, to: number) => ({ long: [from, to] as const });

function plan(floor: number, units: readonly PlanUnit[]): FloorPlan {
  return { floor, image: { src: `/images/projects/parnavaz-65/floors/floor-${floor}.png`, width: 3190, height: 1174 }, units };
}

export const PARNAVAZ_FLOOR_PLANS: readonly FloorPlan[] = [
  plan(2, [
    { points: upperLeft(300), facade: { short: [100, 300] } },
    { points: [[35, 300], [278, 300], [278, 256], [572, 256], [572, 302], [500, 302], [500, 572], [278, 572], [278, 555], [35, 555]], facade: { short: [300, 555], long: [60, 500] } },
    { number: "206", points: [[572, 256], [740, 256], [740, 572], [500, 572], [500, 302], [572, 302]], facade: front(500, 740) },
    { number: "205", points: [[745, 298], [1120, 298], [1120, 572], [745, 572]], facade: front(745, 1120) },
    { number: "204", points: [[1122, 298], [1352, 298], [1352, 572], [1122, 572]], facade: front(1122, 1352) },
    { number: "203", points: [[1355, 92], [1462, 92], [1462, 40], [1577, 40], [1577, 572], [1355, 572]], facade: front(1355, 1580) },
    { number: "201", points: REAR_55 },
  ]),
  plan(3, [
    { number: "305", points: upperLeft(320), facade: { short: [100, 320] } },
    { number: "304", points: [[35, 320], [278, 320], [278, 256], [608, 256], [608, 345], [515, 345], [515, 572], [278, 572], [278, 555], [35, 555]], facade: { short: [320, 555], long: [60, 515] } },
    { number: "303", points: [[608, 258], [725, 258], [725, 572], [515, 572], [515, 345], [608, 345]], facade: front(515, 725) },
    { number: "302", points: [[725, 298], [1355, 298], [1355, 37], [1577, 37], [1577, 572], [725, 572]], facade: front(725, 1580) },
    { number: "301", points: REAR_55 },
  ]),
  plan(4, [
    { points: upperLeft(345), facade: { short: [100, 345] } },
    { number: "408", points: [[35, 345], [278, 345], [278, 555], [35, 555]], facade: { short: [345, 555], long: [60, 278] } },
    { number: "407", points: [[278, 256], [652, 256], [652, 572], [278, 572]], facade: front(278, 652) },
    { number: "405", points: [[655, 260], [725, 260], [725, 298], [1120, 298], [1120, 572], [655, 572]], facade: front(655, 1120) },
    { number: "404", points: RIGHT_46, facade: front(1122, 1349) },
    { number: "403", points: END_45, facade: front(1352, 1580) },
    { number: "401", points: REAR_55 },
    { number: "402", points: REAR_39 },
  ]),
  plan(5, [
    { number: "508", points: CORNER_117, facade: corner117 },
    { number: "507", points: MIDDLE_55, facade: front(278, 508) },
    { number: "506", points: MIDDLE_50, facade: front(508, 735) },
    { number: "505", points: MIDDLE_76, facade: front(737, 1120) },
    { number: "504", points: RIGHT_46, facade: front(1122, 1349) },
    { number: "503", points: END_45, facade: front(1352, 1580) },
    { number: "501", points: REAR_55 },
    { number: "502", points: REAR_39 },
  ]),
  plan(6, [
    { number: "608", points: CORNER_117, facade: corner117 },
    { number: "607", points: MIDDLE_55, facade: front(278, 508) },
    { number: "606", points: MIDDLE_50, facade: front(508, 735) },
    { number: "605", points: MIDDLE_76, facade: front(737, 1120) },
    { number: "604", points: RIGHT_46, facade: front(1122, 1349) },
    { number: "603", points: END_45, facade: front(1352, 1580) },
    { number: "601", points: REAR_55 },
    { number: "602", points: REAR_39 },
  ]),
  plan(7, [
    { number: "709", points: CORNER_117, facade: corner117 },
    { number: "708", points: MIDDLE_55, facade: front(278, 508) },
    { number: "707", points: MIDDLE_50, facade: front(508, 735) },
    { number: "706", points: SMALL_LEFT, facade: front(737, 897) },
    { number: "705", points: SMALL_RIGHT, facade: front(897, 1120) },
    { number: "704", points: RIGHT_46, facade: front(1122, 1349) },
    { number: "703", points: END_45, facade: front(1352, 1580) },
    { number: "701", points: REAR_55 },
    { number: "702", points: REAR_39 },
  ]),
  // Floor VIII is not offered for sale, so its plan carries no units.
  plan(8, []),
];

export function getFloorPlan(floor: number): FloorPlan | undefined {
  return PARNAVAZ_FLOOR_PLANS.find((item) => item.floor === floor);
}

export function findPlanUnit(number: string): { readonly plan: FloorPlan; readonly unit: PlanUnit } | undefined {
  for (const floorPlan of PARNAVAZ_FLOOR_PLANS) {
    const unit = floorPlan.units.find((item) => item.number === number);
    if (unit) return { plan: floorPlan, unit };
  }
  return undefined;
}

/** SVG `points` for a unit outline in plan pixels. */
export function planPoints(points: Points): string {
  return points.map(([x, y]) => `${x},${y}`).join(" ");
}

/** Area-weighted centre of a unit outline, for its label. */
export function planCentre(points: Points): readonly [number, number] {
  let area = 0;
  let cx = 0;
  let cy = 0;
  points.forEach(([x0, y0], index) => {
    const [x1, y1] = points[(index + 1) % points.length];
    const cross = x0 * y1 - x1 * y0;
    area += cross;
    cx += (x0 + x1) * cross;
    cy += (y0 + y1) * cross;
  });
  return area === 0 ? points[0] : [cx / (3 * area), cy / (3 * area)];
}

// The render shows the plan's left end (plan y 100 → 555) from render x 700 to
// the corner at 1134, and the street side (plan x 60 → 1580) from the corner
// to 2052. Each face is a one-dimensional perspective map fitted through its
// structural breaks: the white pier at 865 and the wing step at 1437.
const LONG_FACE = { start: 60, a: 3.0823, c: 0.0012078 };
const SHORT_FACE = { corner: 555, a: -0.5247, c: 0.000613 };
const CORNER_X = 1134;

/** Render x for a point on the street side (plan x). */
export function longFaceX(planX: number): number {
  const s = planX - LONG_FACE.start;
  return (LONG_FACE.a * s + CORNER_X) / (LONG_FACE.c * s + 1);
}

/** Render x for a point on the left end (plan y). */
export function shortFaceX(planY: number): number {
  const d = SHORT_FACE.corner - planY;
  return (SHORT_FACE.a * d + CORNER_X) / (SHORT_FACE.c * d + 1);
}

function parse(points: string): readonly (readonly [number, number])[] {
  return points.trim().split(/\s+/).map((point) => point.split(",").map(Number) as unknown as readonly [number, number]);
}

/** y on a polyline at render x, clamped to its ends. */
function along(chain: readonly (readonly [number, number])[], x: number): number {
  const sorted = [...chain].sort((p, q) => p[0] - q[0]);
  if (x <= sorted[0][0]) return sorted[0][1];
  for (let index = 1; index < sorted.length; index += 1) {
    const [x1, y1] = sorted[index];
    const [x0, y0] = sorted[index - 1];
    if (x <= x1) return x1 === x0 ? y1 : y0 + (y1 - y0) * (x - x0) / (x1 - x0);
  }
  return sorted[sorted.length - 1][1];
}

/**
 * The unit's patch of the building render: the floor's slab band between the
 * render x where the unit starts and ends. Floor polygons list their top edge
 * left to right, then their bottom edge right to left, eight points each.
 */
export function facadeOutline(floor: number, unit: PlanUnit): string | null {
  const band = PARNAVAZ_FACADE_FLOORS.find((item) => item.number === floor);
  if (!band || !unit.facade) return null;
  const points = parse(band.points);
  if (points.length !== 16) return null;
  const top = points.slice(0, 8);
  const bottom = points.slice(8);
  const { short, long } = unit.facade;
  const from = short ? shortFaceX(short[0]) : longFaceX(long![0]);
  const to = long ? longFaceX(long[1]) : shortFaceX(short![1]);
  // Sample across, keeping the corner and every kink of the slab edges.
  const xs = new Set<number>([from, to]);
  for (const [x] of [...top, ...bottom]) if (x > from && x < to) xs.add(x);
  for (let step = 1; step < 12; step += 1) xs.add(from + (to - from) * step / 12);
  const ordered = [...xs].sort((p, q) => p - q);
  const upper = ordered.map((x) => `${Math.round(x)},${Math.round(along(top, x))}`);
  const lower = [...ordered].reverse().map((x) => `${Math.round(x)},${Math.round(along(bottom, x))}`);
  return [...upper, ...lower].join(" ");
}
