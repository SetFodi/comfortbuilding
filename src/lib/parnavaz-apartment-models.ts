import type {
  ApartmentModel,
  AxisCalibration,
  CalibrationZone,
  PlanFloor,
  PlanFurniture,
  PlanOpening,
  PlanPoint,
  PlanWidening,
} from "./apartment-model";

/**
 * Traced from the plan portion of each supplied interior concept board, then
 * calibrated against the architectural floor plan in the sales team's price
 * sheet (floor VI, which contains all seven types; 71.57 px per metre at
 * 300 dpi). The boards are AI concepts and are not drawn to scale, so each
 * model maps board pixels to measured metres. Layout, furniture and finishes
 * remain illustrative, not construction drawings.
 *
 * Traces stay in board pixels so they can be audited against the boards.
 * The viewer receives normalized coordinates inside a metre-scaled frame.
 * Furniture rotation turns an item's front (local +z, towards the bottom of
 * the board) clockwise in plan: 90 faces left, 180 up and 270 right.
 */
interface BoardModel {
  readonly id: string;
  readonly area: number;
  readonly bedrooms: number;
  readonly source: ApartmentModel["source"];
  readonly calibration: readonly CalibrationZone[];
  readonly widen?: PlanWidening;
  readonly footprint: readonly PlanPoint[];
  readonly walls: readonly (readonly [PlanPoint, PlanPoint])[];
  readonly openings: readonly PlanOpening[];
  /**
   * Structural columns: a board-pixel centre for a standard COLUMN_SIZE
   * column, or a board-pixel [left, top, width, height] for any other size.
   */
  readonly columns?: readonly (PlanPoint | readonly [number, number, number, number])[];
  readonly floors: readonly PlanFloor[];
  readonly furniture: readonly PlanFurniture[];
  readonly viewpoints: ApartmentModel["viewpoints"];
  /** Off when a hand-built interior places this model's doors and furniture itself. */
  readonly refine?: boolean;
}

/** Structural columns on the architectural plan are about 45 cm square. */
const COLUMN_SIZE = 0.45;

/** Interior doors narrower than this open up in the 3D views. */
const MIN_DOOR_WIDTH = 0.76;

/**
 * Board doors are often drawn 0.55–0.65 m wide, too tight to walk through
 * comfortably. Like the walkway widening, this is 3D only: each narrow door
 * grows into the collinear wall at either end, keeping 10 cm of that wall.
 */
function widenDoors(model: ApartmentModel): ApartmentModel {
  const { width, depth } = model.size;
  const walls = model.walls.map(([from, to]) => [from, to] as [PlanPoint, PlanPoint]);
  const same = (a: PlanPoint, b: PlanPoint) => Math.hypot((a[0] - b[0]) * width, (a[1] - b[1]) * depth) < 0.01;
  const openings = model.openings.map((opening) => {
    if (opening.kind !== "door") return opening;
    const ux = (opening.to[0] - opening.from[0]) * width;
    const uz = (opening.to[1] - opening.from[1]) * depth;
    const length = Math.hypot(ux, uz);
    if (length >= MIN_DOOR_WIDTH || length === 0) return opening;
    const direction = [ux / length, uz / length] as const;
    // How far each end can grow into the wall that continues it.
    const room = (end: PlanPoint, outward: 1 | -1) => {
      let best: { index: number; at: 0 | 1; spare: number } | null = null;
      walls.forEach(([from, to], index) => {
        for (const at of [0, 1] as const) {
          const [shared, other] = at === 0 ? [from, to] : [to, from];
          if (!same(shared, end)) continue;
          const dx = (other[0] - shared[0]) * width;
          const dz = (other[1] - shared[1]) * depth;
          const wallLength = Math.hypot(dx, dz);
          if ((dx * direction[0] + dz * direction[1]) * outward < wallLength * 0.98) continue;
          const spare = wallLength - 0.1;
          if (spare > 0 && (!best || spare > best.spare)) best = { index, at, spare };
        }
      });
      return best as { index: number; at: 0 | 1; spare: number } | null;
    };
    const before = room(opening.from, -1);
    const after = room(opening.to, 1);
    const need = MIN_DOOR_WIDTH - length;
    // Split evenly; a side that cannot take its share passes it to the other.
    const growBefore = Math.min(before?.spare ?? 0, Math.max(need / 2, need - (after?.spare ?? 0)));
    const growAfter = Math.min(after?.spare ?? 0, need - growBefore);
    const move = (point: PlanPoint, metres: number): PlanPoint => [
      point[0] + direction[0] * metres / width,
      point[1] + direction[1] * metres / depth,
    ];
    const from = move(opening.from, -growBefore);
    const to = move(opening.to, growAfter);
    if (before) walls[before.index][before.at] = from;
    if (after) walls[after.index][after.at] = to;
    return { ...opening, from, to };
  });
  return { ...model, walls, openings };
}

/** Pieces that stand against a wall in every board. */
const WALL_BACKED = new Set<PlanFurniture["kind"]>([
  "bed", "nightstand", "wardrobe", "kitchen", "fridge", "media", "console",
  "shelving", "vanity", "toilet", "bathtub", "sofa", "ledge",
]);

/**
 * The boards draw walls two to three times their real thickness, so pieces
 * traced against a drawn wall face float in front of the real one. This
 * moves each wall-backed piece back onto the face of a parallel wall behind
 * it, unless a window or door is closer. Works in the widened metre frame.
 */
function snapToWalls(model: ApartmentModel): readonly PlanFurniture[] {
  const { width, depth } = model.size;
  const metres = ([x, z]: PlanPoint) => [x * width, z * depth] as const;
  const onOutline = (point: PlanPoint) => model.footprint.some((corner, index) => {
    const next = model.footprint[(index + 1) % model.footprint.length];
    const [ax, az] = metres(corner);
    const [bx, bz] = metres(next);
    const [px, pz] = metres(point);
    const length = Math.hypot(bx - ax, bz - az) || 1;
    return Math.abs((px - ax) * (bz - az) - (pz - az) * (bx - ax)) / length < 0.05
      && (px - ax) * (bx - ax) + (pz - az) * (bz - az) >= -0.05 * length
      && (px - bx) * (ax - bx) + (pz - bz) * (az - bz) >= -0.05 * length;
  });
  // Furniture behind a piece stops it. A headboard shelf or cistern ledge is
  // as good as a wall to stand against, and so is a structural column;
  // anything else just blocks the move. Rugs and plants never block.
  type Segment = {
    readonly from: PlanPoint;
    readonly to: PlanPoint;
    readonly kind: "wall" | "opening" | "blocker";
    readonly half: number;
    readonly piece: PlanFurniture | null;
  };
  const edgesOf = ([x, z, w, d]: readonly [number, number, number, number]) => {
    const corners: PlanPoint[] = [[x, z], [x + w, z], [x + w, z + d], [x, z + d]];
    return corners.map((corner, index) => [corner, corners[(index + 1) % 4]] as const);
  };
  const segments: Segment[] = [
    ...model.walls.map(([from, to]) => ({ from, to, kind: "wall" as const, half: onOutline(from) && onOutline(to) ? 0.11 : 0.06, piece: null })),
    ...model.openings.map(({ from, to }) => ({ from, to, kind: "opening" as const, half: 0.06, piece: null })),
    ...(model.columns ?? []).flatMap((column) => edgesOf(column).map(([from, to]) => ({ from, to, kind: "wall" as const, half: 0, piece: null }))),
    ...model.furniture
      .filter(({ kind }) => kind !== "rug" && kind !== "plant")
      .flatMap((piece) => edgesOf(piece.rect).map(([from, to]) => ({
        from, to, kind: piece.kind === "shelving" || piece.kind === "ledge" ? "wall" as const : "blocker" as const, half: 0, piece,
      }))),
  ];
  const isBedside = (item: PlanFurniture) => item.kind === "nightstand" || item.kind === "sideTable";
  /**
   * What stands behind a piece: the nearest segment overlapping its back edge
   * (less 2 cm at each end, so neighbours beside it do not count), and
   * whether that is a door or window right behind its middle.
   */
  const behindOf = (item: PlanFurniture, rotation = item.rotation, skip: readonly PlanFurniture[] = []) => {
    const [left, top, w, d] = item.rect;
    const turn = (rotation ?? 0) * Math.PI / 180;
    const back = [Math.round(Math.sin(turn)), -Math.round(Math.cos(turn))] as const;
    const along = [-back[1], back[0]] as const;
    const [cx, cz] = metres([left + w / 2, top + d / 2]);
    const sideways = back[0] !== 0;
    const half = sideways ? w * width / 2 : d * depth / 2;
    const span = (sideways ? d * depth : w * width) / 2 - 0.02;
    const edge = [cx + back[0] * half, cz + back[1] * half] as const;
    const found: { gap: number; kind: Segment["kind"]; middle: boolean }[] = [];
    for (const segment of segments) {
      // A bed's own bedside tables sit beside it, never behind it.
      if (segment.piece === item || (segment.piece && skip.includes(segment.piece))) continue;
      if (item.kind === "bed" && segment.piece && isBedside(segment.piece)) continue;
      const [ax, az] = metres(segment.from);
      const [bx, bz] = metres(segment.to);
      const length = Math.hypot(bx - ax, bz - az);
      if (length < 0.05 || Math.abs(((bx - ax) * back[0] + (bz - az) * back[1]) / length) > 0.2) continue;
      const sa = (ax - edge[0]) * along[0] + (az - edge[1]) * along[1];
      const sb = (bx - edge[0]) * along[0] + (bz - edge[1]) * along[1];
      if (Math.max(sa, sb) < -span || Math.min(sa, sb) > span) continue;
      // Depth behind the edge, where the segment is nearest the piece's middle.
      const s = Math.max(Math.min(sa, sb), Math.min(Math.max(sa, sb), 0));
      const t = sb === sa ? 0 : (s - sa) / (sb - sa);
      const behind = (ax + (bx - ax) * t - edge[0]) * back[0] + (az + (bz - az) * t - edge[1]) * back[1];
      const gap = behind - segment.half;
      if (gap > -0.03) found.push({ gap, kind: segment.kind, middle: Math.min(sa, sb) <= 0 && Math.max(sa, sb) >= 0 });
    }
    if (!found.length) return { back, gap: null, snap: false };
    const gap = Math.min(...found.map((entry) => entry.gap));
    const nearest = found.filter((entry) => entry.gap < gap + 0.01);
    // Snap onto a wall face, unless something else stops the piece first or
    // a door or window sits right behind its middle.
    const snap = nearest.some(({ kind }) => kind === "wall")
      && !nearest.some(({ kind, middle }) => kind === "blocker" || (kind === "opening" && middle));
    return { back, gap, snap };
  };
  const shiftOf = (item: PlanFurniture): readonly [number, number] => {
    const { back, gap, snap } = behindOf(item);
    // Sofas anchor a rug and table group, so only small gaps are closed.
    const limit = item.kind === "sofa" ? 0.4 : 0.55;
    if (!snap || gap === null || gap < 0.015 || gap > limit) return [0, 0];
    const shift = gap - 0.01;
    return [back[0] * shift / width, back[1] * shift / depth];
  };
  const moved = (item: PlanFurniture, [dx, dz]: readonly [number, number], rotation = item.rotation): PlanFurniture => {
    const [left, top, w, d] = item.rect;
    return { ...item, rotation, rect: [left + dx, top + dz, w, d] };
  };
  const beds = model.furniture.filter(({ kind }) => kind === "bed").map((bed) => ({ bed, shift: shiftOf(bed) }));
  return model.furniture.map((item) => {
    if (item.kind === "bed") return moved(item, beds.find(({ bed }) => bed === item)!.shift);
    if (isBedside(item)) {
      // Bedside tables stay beside their bed and face the same way, but
      // never follow it through a wall the bed itself did not reach.
      const [left, top, w, d] = item.rect;
      const reach = 0.35;
      const owner = beds.find(({ bed: { rect: [bl, bt, bw, bd] } }) =>
        left < bl + bw + reach / width && left + w > bl - reach / width
        && top < bt + bd + reach / depth && top + d > bt - reach / depth);
      if (owner) {
        const rotation = item.kind === "nightstand" ? owner.bed.rotation : item.rotation;
        const { gap } = behindOf(item, owner.bed.rotation, [owner.bed]);
        const [dx, dz] = owner.shift;
        const wanted = Math.hypot(dx * width, dz * depth);
        const scale = wanted === 0 || gap === null ? 1 : Math.max(0, Math.min(wanted, gap - 0.01)) / wanted;
        return moved(item, [dx * scale, dz * scale], rotation);
      }
    }
    if (!WALL_BACKED.has(item.kind)) return item;
    return moved(item, shiftOf(item));
  });
}

/** Built-in runs that are cut to length around a column or wall end. */
const RUNS = new Set<PlanFurniture["kind"]>(["kitchen", "shelving", "console", "media", "wardrobe", "ledge", "vanity"]);

/**
 * No piece may stand inside a wall or column. A run that meets one at an end
 * (a kitchen traced into a bay's side wall, a headboard shelf over a column)
 * is cut short there; anything else (a deep nightstand beside a snapped bed)
 * moves out the short way. Rugs lie under everything and stay put.
 */
function clearStructure(model: ApartmentModel, furniture: readonly PlanFurniture[]): readonly PlanFurniture[] {
  const { width, depth } = model.size;
  const outline = (point: PlanPoint) => model.footprint.some((corner, index) => {
    const next = model.footprint[(index + 1) % model.footprint.length];
    const [ax, az, bx, bz] = [corner[0] * width, corner[1] * depth, next[0] * width, next[1] * depth];
    const [px, pz] = [point[0] * width, point[1] * depth];
    const length = Math.hypot(bx - ax, bz - az) || 1;
    const t = Math.max(0, Math.min(1, ((px - ax) * (bx - ax) + (pz - az) * (bz - az)) / (length * length)));
    return Math.hypot(px - ax - t * (bx - ax), pz - az - t * (bz - az)) < 0.05;
  });
  // Solid boxes in metres: [left, top, right, bottom], and whether each is a column.
  const solids = [
    ...model.walls.map(([from, to]) => {
      const half = outline(from) && outline(to) ? 0.11 : 0.06;
      const [ax, az, bx, bz] = [from[0] * width, from[1] * depth, to[0] * width, to[1] * depth];
      const vertical = Math.abs(ax - bx) < Math.abs(az - bz);
      return [
        Math.min(ax, bx) - (vertical ? half : 0), Math.min(az, bz) - (vertical ? 0 : half),
        Math.max(ax, bx) + (vertical ? half : 0), Math.max(az, bz) + (vertical ? 0 : half), false,
      ] as const;
    }),
    ...(model.columns ?? []).map(([x, z, w, d]) => [x * width, z * depth, (x + w) * width, (z + d) * depth, true] as const),
  ];
  return furniture.map((item) => {
    if (item.kind === "rug") return item;
    let [left, top, w, d] = item.rect;
    // A run's length lies along its back wall: plan x unless it is turned sideways.
    const turn = (item.rotation ?? 0) * Math.PI / 180;
    const runAlongX = Math.abs(Math.sin(turn)) < 0.5;
    const back = [Math.round(Math.sin(turn)), -Math.round(Math.cos(turn))] as const;
    for (let pass = 0; pass < 3; pass += 1) {
      let moved = false;
      for (const [sl, st, sr, sb, column] of solids) {
        const [il, it, ir, ib] = [left * width, top * depth, (left + w) * width, (top + d) * depth];
        const overlapX = Math.min(ir, sr) - Math.max(il, sl);
        const overlapZ = Math.min(ib, sb) - Math.max(it, st);
        if (overlapX <= 0.005 || overlapZ <= 0.005) continue;
        const [start, end, solidStart, solidEnd, across] = runAlongX
          ? [il, ir, sl, sr, overlapZ] : [it, ib, st, sb, overlapX];
        if (column && item.kind === "media") {
          // A built-in TV unit may wrap a column standing against its back
          // wall, as long as a shelf still runs in front of it.
          const backOf = (x: number, z: number) => x * back[0] + z * back[1];
          const pieceBack = Math.max(backOf(il, it), backOf(ir, ib), backOf(il, ib), backOf(ir, it));
          const pieceFront = Math.min(backOf(il, it), backOf(ir, ib), backOf(il, ib), backOf(ir, it));
          const columnFront = Math.min(backOf(sl, st), backOf(sr, sb), backOf(sl, sb), backOf(sr, st));
          const columnBack = Math.max(backOf(sl, st), backOf(sr, sb), backOf(sl, sb), backOf(sr, st));
          if (columnBack >= pieceBack - 0.02 && columnFront - pieceFront >= 0.12) continue;
        }
        const centre = (start + end) / 2;
        // Cutting a run short at an end beats standing it off its wall for
        // its whole length, unless the cut would take too much.
        const removed = solidEnd < centre ? solidEnd - start : solidStart > centre ? end - solidStart : Infinity;
        if (RUNS.has(item.kind) && removed <= (end - start) * 0.5 && removed < across * 2.5) {
          const cut = (removed + 0.005) / (runAlongX ? width : depth);
          if (runAlongX) { if (solidEnd < centre) left += cut; w -= cut; }
          else { if (solidEnd < centre) top += cut; d -= cut; }
        } else if (overlapX < overlapZ) {
          // Out along the shallower overlap, away from the solid's centre.
          left += (il + ir < sl + sr ? -1 : 1) * (overlapX + 0.005) / width;
        } else {
          top += (it + ib < st + sb ? -1 : 1) * (overlapZ + 0.005) / depth;
        }
        moved = true;
      }
      if (!moved) break;
    }
    const [l0, t0, w0, d0] = item.rect;
    return left === l0 && top === t0 && w === w0 && d === d0 ? item : { ...item, rect: [left, top, w, d] };
  });
}

/**
 * The boards' art lets neighbours overlap a little. Bedside tables slide out
 * from under their bed's edge, and a run that meets a fridge or wardrobe at
 * an end stops at it.
 */
function separate(model: ApartmentModel, furniture: readonly PlanFurniture[]): readonly PlanFurniture[] {
  const { width, depth } = model.size;
  const box = ([x, z, w, d]: readonly number[]) => [x * width, z * depth, (x + w) * width, (z + d) * depth] as const;
  const beds = furniture.filter(({ kind }) => kind === "bed");
  const tall = furniture.filter(({ kind }) => kind === "fridge" || kind === "wardrobe");
  return furniture.map((item) => {
    let [left, top, w, d] = item.rect;
    if (item.kind === "nightstand" || item.kind === "sideTable") {
      for (const bed of beds) {
        const [bl, bt, br, bb] = box(bed.rect);
        const [il, it, ir, ib] = box([left, top, w, d]);
        const overlapX = Math.min(ir, br) - Math.max(il, bl);
        const overlapZ = Math.min(ib, bb) - Math.max(it, bt);
        if (overlapX <= 0.01 || overlapZ <= 0.01) continue;
        // Out across the bed's width, the way the table already sits.
        const acrossX = Math.abs(Math.sin((bed.rotation ?? 0) * Math.PI / 180)) < 0.5;
        if (acrossX) left += (il + ir < bl + br ? -1 : 1) * (overlapX + 0.01) / width;
        else top += (it + ib < bt + bb ? -1 : 1) * (overlapZ + 0.01) / depth;
      }
    }
    if (RUNS.has(item.kind) && item.kind !== "wardrobe") {
      const runAlongX = Math.abs(Math.sin((item.rotation ?? 0) * Math.PI / 180)) < 0.5;
      for (const piece of tall) {
        const [sl, st, sr, sb] = box(piece.rect);
        const [il, it, ir, ib] = box([left, top, w, d]);
        const overlapX = Math.min(ir, sr) - Math.max(il, sl);
        const overlapZ = Math.min(ib, sb) - Math.max(it, st);
        if (overlapX <= 0.005 || overlapZ <= 0.005) continue;
        const [start, end, solidStart, solidEnd, overlap] = runAlongX ? [il, ir, sl, sr, overlapX] : [it, ib, st, sb, overlapZ];
        const centre = (start + end) / 2;
        if ((solidEnd >= centre && solidStart <= centre) || overlap >= (end - start) * 0.3) continue;
        const cut = (overlap + 0.005) / (runAlongX ? width : depth);
        if (runAlongX) { if (solidEnd < centre) left += cut; w -= cut; }
        else { if (solidEnd < centre) top += cut; d -= cut; }
      }
    }
    const [l0, t0, w0, d0] = item.rect;
    return left === l0 && top === t0 && w === w0 && d === d0 ? item : { ...item, rect: [left, top, w, d] };
  });
}

function interpolate(points: AxisCalibration, value: number): number {
  if (points.length === 1) return points[0][1];
  let index = 1;
  while (index < points.length - 1 && value > points[index][0]) index += 1;
  const [x0, y0] = points[index - 1];
  const [x1, y1] = points[index];
  return y0 + (value - x0) * (y1 - y0) / (x1 - x0);
}

/** Converts a board pixel into metres; the first zone containing it wins. */
export function boardToMetres(
  zones: readonly CalibrationZone[],
  [x, y]: PlanPoint,
): PlanPoint {
  const zone = zones.find(({ within }) => !within || (
    x >= within[0] && x <= within[2] && y >= within[1] && y <= within[3]
  )) ?? zones[zones.length - 1];
  return [interpolate(zone.x, x), interpolate(zone.z, y)];
}

/** Real metres plus any walkway space inserted for the 3D views. */
export function boardToVisualMetres(
  model: Pick<ApartmentModel, "calibration" | "widen">,
  point: PlanPoint,
): PlanPoint {
  const [x, z] = boardToMetres(model.calibration, point);
  const extra = (insertions: PlanWidening["x"], value: number) =>
    (insertions ?? []).reduce((sum, [at, metres]) => sum + (value > at ? metres : 0), 0);
  return [x + extra(model.widen?.x, point[0]), z + extra(model.widen?.z, point[1])];
}

/** The metre frame that normalized model coordinates span. */
function frameFor(model: Pick<BoardModel, "calibration" | "widen" | "source" | "footprint">) {
  const [left, top, width, height] = model.source.crop;
  const corners: PlanPoint[] = [[left, top], [left + width, top + height]];
  const points = [...corners, ...model.footprint].map((point) => boardToVisualMetres(model, point));
  const minX = Math.min(...points.map(([x]) => x));
  const minZ = Math.min(...points.map(([, z]) => z));
  return {
    left: minX,
    top: minZ,
    width: Math.max(...points.map(([x]) => x)) - minX,
    depth: Math.max(...points.map(([, z]) => z)) - minZ,
  };
}

/** Maps a source-board pixel to a traced model's normalized coordinates. */
export function boardToNormalized(
  model: Pick<ApartmentModel, "calibration" | "widen" | "size" | "origin">,
  point: PlanPoint,
): PlanPoint {
  const [x, z] = boardToVisualMetres(model, point);
  return [(x - model.origin.x) / model.size.width, (z - model.origin.z) / model.size.depth];
}

function trace({ refine = true, ...model }: BoardModel): ApartmentModel {
  const frame = frameFor(model);
  const placement = {
    calibration: model.calibration,
    widen: model.widen,
    size: { width: frame.width, depth: frame.depth },
    origin: { x: frame.left, z: frame.top },
  };
  const point = (coordinate: PlanPoint): PlanPoint => boardToNormalized(placement, coordinate);
  const rect = ([left, top, width, height]: readonly [number, number, number, number]) => {
    const [x0, z0] = point([left, top]);
    const [x1, z1] = point([left + width, top + height]);
    return [x0, z0, x1 - x0, z1 - z0] as const;
  };
  // Furniture keeps its real size; only its centre follows any widening.
  const item = ([left, top, width, height]: readonly [number, number, number, number]) => {
    const [ax, az] = boardToMetres(model.calibration, [left, top]);
    const [bx, bz] = boardToMetres(model.calibration, [left + width, top + height]);
    const [cx, cz] = point([left + width / 2, top + height / 2]);
    const w = (bx - ax) / frame.width;
    const d = (bz - az) / frame.depth;
    return [cx - w / 2, cz - d / 2, w, d] as const;
  };

  const traced: ApartmentModel = {
    ...model,
    ...placement,
    footprint: model.footprint.map(point),
    walls: model.walls.map(([start, end]) => [point(start), point(end)]),
    openings: model.openings.map((opening) => ({
      ...opening,
      from: point(opening.from),
      to: point(opening.to),
    })),
    columns: model.columns?.map((column) => {
      if (column.length === 4) return item(column);
      const [cx, cz] = point(column);
      const w = COLUMN_SIZE / frame.width;
      const d = COLUMN_SIZE / frame.depth;
      return [cx - w / 2, cz - d / 2, w, d] as const;
    }),
    floors: model.floors.map((floor) => ({ ...floor, rect: rect(floor.rect) })),
    furniture: model.furniture.map((piece) => ({ ...piece, rect: item(piece.rect) })),
    viewpoints: model.viewpoints.map((viewpoint) => ({
      ...viewpoint,
      position: point(viewpoint.position),
      target: point(viewpoint.target),
    })),
  };
  if (!refine) return traced;
  const doors = widenDoors(traced);
  // Clear the structure before snapping too, so a run cut short at a column
  // can still back onto the wall beside it, and whatever leans on it follows.
  const cleared = { ...doors, furniture: clearStructure(doors, doors.furniture) };
  return { ...cleared, furniture: clearStructure(cleared, separate(cleared, snapToWalls(cleared))) };
}

export const PARNAVAZ_APARTMENT_MODELS: readonly ApartmentModel[] = [
  trace({
    // Apartments 503 and 603: 40.8 m² inside and a 4.9 m² balcony.
    id: "parnavaz-45-70",
    area: 45.7,
    bedrooms: 1,
    source: {
      src: "/images/projects/parnavaz-65/layouts/45-70.jpg",
      width: 853,
      height: 1276,
      crop: [23, 91, 553, 854],
    },
    calibration: [{
      x: [[48, 0], [550, 6.35]],
      z: [[105, 0], [275, 1.66], [429, 3.53], [810, 6.9], [923, 7.76]],
    }],
    // 3D only: opens the kitchen aisle, the passage to the bedroom and the
    // walkway past the TV.
    widen: { x: [[280, 0.4]], z: [[395, 0.35]] },
    footprint: [[39, 105], [550, 105], [550, 923], [39, 923]],
    walls: [
      [[48, 105], [80, 105]],
      [[146, 105], [550, 105]],
      [[48, 105], [48, 810]],
      [[550, 105], [550, 810]],
      [[48, 810], [119, 810]],
      [[217, 810], [312, 810]],
      [[478, 810], [550, 810]],
      [[48, 810], [48, 923]],
      [[550, 810], [550, 923]],
      [[300, 272], [300, 275]],
      [[199, 275], [543, 275]],
      [[306, 429], [543, 429]],
      [[306, 429], [306, 696]],
      [[306, 765], [306, 810]],
    ],
    openings: [
      { kind: "entrance", from: [80, 105], to: [146, 105], hinge: "from", swing: 1 },
      // A frosted glass partition, then the bathroom door below it.
      { kind: "glazing", from: [300, 116], to: [300, 195] },
      { kind: "door", from: [300, 195], to: [300, 272], hinge: "from", swing: -1 },
      { kind: "door", from: [306, 696], to: [306, 765], hinge: "from", swing: -1 },
      { kind: "balcony", from: [119, 810], to: [217, 810] },
      { kind: "glazing", from: [312, 810], to: [386, 810] },
      { kind: "balcony", from: [386, 810], to: [478, 810] },
    ],
    columns: [[51, 726], [550, 726]],
    floors: [
      { kind: "tile", rect: [300, 105, 250, 170] },
      { kind: "balcony", rect: [48, 810, 502, 113] },
    ],
    furniture: [
      { kind: "rug", rect: [117, 430, 150, 290] },
      { kind: "rug", rect: [335, 533, 173, 198] },
      { kind: "rug", rect: [95, 203, 63, 33] },
      { kind: "rug", rect: [240, 848, 250, 60] },
      { kind: "sofa", rect: [91, 427, 81, 266], rotation: 270 },
      { kind: "table", rect: [196, 480, 44, 144] },
      { kind: "console", rect: [62, 343, 30, 82], rotation: 270 },
      // The plan draws the TV behind the sofa; the board's living room photo
      // hangs it on the wall opposite, which is where it goes here.
      { kind: "media", rect: [281, 470, 24, 190], rotation: 90 },
      // Under-counter appliance at the left, the sink mid-run, the hob at the end.
      { kind: "kitchen", rect: [308, 285, 224, 67], fittings: { hob: 0.4, sink: 0 } },
      { kind: "bed", rect: [365, 478, 117, 237] },
      { kind: "nightstand", rect: [332, 483, 31, 34], shape: "round" },
      { kind: "nightstand", rect: [482, 483, 31, 34], shape: "round" },
      { kind: "shelving", rect: [318, 438, 225, 36] },
      // Slim wall shelves either side of the bed.
      { kind: "shelving", rect: [520, 474, 20, 217], rotation: 90 },
      { kind: "shelving", rect: [310, 474, 18, 211], rotation: 270 },
      { kind: "vanity", rect: [333, 134, 46, 44] },
      { kind: "toilet", rect: [404, 135, 29, 55] },
      { kind: "shower", rect: [458, 187, 72, 79], rotation: 90, shape: "round" },
      { kind: "console", rect: [452, 128, 60, 38] },
      // Ends at the bathroom door jamb, as on the board.
      { kind: "console", rect: [258, 132, 34, 80], rotation: 90 },
      { kind: "console", rect: [60, 165, 24, 62], rotation: 270 },
      { kind: "armchair", rect: [423, 839, 70, 69], rotation: 45 },
      { kind: "sideTable", rect: [403, 851, 26, 26] },
      { kind: "plant", rect: [75, 845, 36, 45] },
      { kind: "plant", rect: [491, 740, 35, 44] },
      { kind: "plant", rect: [78, 696, 45, 50] },
      { kind: "plant", rect: [60, 628, 36, 50] },
    ],
    viewpoints: [
      { id: "living", position: [262, 662], target: [126, 535] },
      { id: "bedroom", position: [369, 754], target: [425, 544] },
      { id: "kitchen", position: [296, 412], target: [452, 312] },
      { id: "bathroom", position: [400, 235], target: [350, 150] },
    ],
  }),
  trace({
    // Apartments 604 and 704: 41.5 m² inside and a 5.0 m² balcony. The
    // calibration stays linear because the detailed interior and the
    // walkthrough place their geometry with a linear pixel mapping.
    id: "parnavaz-46-50",
    refine: false,
    area: 46.5,
    bedrooms: 1,
    source: {
      src: "/images/projects/parnavaz-65/layouts/46-50.jpg",
      width: 1024,
      height: 1273,
      crop: [20, 90, 702, 860],
    },
    calibration: [{ x: [[49, 0], [697, 6.4]], z: [[103, 0], [823, 6.9]] }],
    // 3D only: opens the kitchen aisle and the living room.
    widen: { x: [[450, 0.25]], z: [[395, 0.4]] },
    footprint: [[44, 103], [697, 103], [697, 928], [44, 928]],
    walls: [
      [[49, 103], [494, 103]],
      [[590, 103], [697, 103]],
      [[49, 103], [49, 259]],
      [[49, 326], [49, 429]],
      [[49, 429], [49, 516]],
      [[49, 603], [49, 823]],
      [[697, 103], [697, 823]],
      [[49, 823], [145, 823]],
      [[265, 823], [383, 823]],
      [[630, 823], [697, 823]],
      [[49, 823], [49, 928]],
      [[697, 823], [697, 928]],
      [[383, 115], [383, 132]],
      [[383, 194], [383, 260]],
      [[69, 260], [501, 260]],
      [[58, 429], [372, 429]],
      [[372, 429], [372, 728]],
      [[372, 791], [372, 823]],
    ],
    openings: [
      { kind: "entrance", from: [494, 103], to: [590, 103], hinge: "to", swing: 1 },
      { kind: "door", from: [383, 132], to: [383, 194], hinge: "from", swing: 1 },
      { kind: "door", from: [372, 728], to: [372, 791], hinge: "to", swing: 1 },
      { kind: "window", from: [49, 259], to: [49, 326] },
      { kind: "window", from: [49, 516], to: [49, 603] },
      { kind: "balcony", from: [145, 823], to: [265, 823] },
      { kind: "balcony", from: [383, 823], to: [630, 823] },
    ],
    floors: [
      { kind: "tile", rect: [49, 103, 334, 157] },
      { kind: "balcony", rect: [49, 823, 648, 105] },
    ],
    furniture: [
      { kind: "bathtub", rect: [86, 121, 69, 126] },
      { kind: "toilet", rect: [203, 197, 36, 53] },
      { kind: "vanity", rect: [299, 209, 61, 43] },
      { kind: "kitchen", rect: [71, 270, 285, 66] },
      { kind: "table", rect: [358, 277, 139, 49] },
      { kind: "chair", rect: [383, 332, 42, 38] },
      { kind: "chair", rect: [438, 332, 39, 38] },
      { kind: "wardrobe", rect: [622, 131, 39, 126] },
      { kind: "sofa", rect: [581, 437, 85, 276], rotation: 90 },
      { kind: "table", rect: [487, 525, 63, 132] },
      { kind: "wardrobe", rect: [383, 473, 32, 215] },
      { kind: "bed", rect: [124, 484, 167, 238] },
      { kind: "table", rect: [85, 483, 38, 48] },
      { kind: "table", rect: [291, 483, 40, 48] },
      { kind: "wardrobe", rect: [340, 441, 22, 281] },
      { kind: "chair", rect: [580, 722, 65, 57], rotation: 45 },
      { kind: "chair", rect: [528, 850, 68, 65], rotation: 45 },
      { kind: "plant", rect: [599, 851, 45, 50] },
      { kind: "plant", rect: [610, 680, 47, 46] },
    ],
    viewpoints: [
      { id: "living", position: [464, 740], target: [624, 533] },
      { id: "bedroom", position: [299, 758], target: [198, 565] },
      { id: "kitchen", position: [531, 371], target: [243, 301] },
      { id: "bathroom", position: [350, 165], target: [130, 170] },
    ],
  }),
  trace({
    // Apartment 606: 43.9 m² inside and a 6.2 m² balcony.
    id: "parnavaz-50-10",
    area: 50.1,
    bedrooms: 1,
    source: {
      src: "/images/projects/parnavaz-65/layouts/50-10.jpg",
      width: 1017,
      height: 1265,
      crop: [22, 101, 706, 845],
    },
    calibration: [{
      x: [[50, 0], [695, 6.4]],
      z: [[115, 0], [222, 1.3], [800, 7.8], [925, 8.86]],
    }],
    // 3D only: opens the space beside the sofa and in front of the TV.
    widen: { x: [[140, 0.2], [335, 0.3]] },
    footprint: [
      [46, 222], [248, 222], [248, 115],
      [695, 115], [695, 925], [46, 925],
    ],
    walls: [
      [[50, 222], [303, 222]],
      [[248, 115], [248, 222]],
      [[248, 115], [333, 115]],
      [[423, 115], [695, 115]],
      [[50, 222], [50, 800]],
      [[695, 115], [695, 800]],
      [[50, 800], [147, 800]],
      [[271, 800], [396, 800]],
      [[608, 800], [695, 800]],
      [[50, 800], [50, 925]],
      [[695, 800], [695, 925]],
      [[493, 126], [493, 212]],
      [[493, 281], [493, 378]],
      [[479, 378], [695, 378]],
      [[396, 378], [396, 800]],
    ],
    columns: [[52, 240], [693, 152], [52, 736], [697, 736]],
    openings: [
      { kind: "entrance", from: [333, 115], to: [423, 115], hinge: "from", swing: 1 },
      { kind: "door", from: [493, 212], to: [493, 281], hinge: "to", swing: -1 },
      // A pair of leaves opening into the bedroom.
      { kind: "door", from: [396, 378], to: [479, 378], swing: 1, leaves: 2 },
      { kind: "balcony", from: [147, 800], to: [271, 800] },
      { kind: "glazing", from: [400, 800], to: [492, 800] },
      { kind: "balcony", from: [492, 800], to: [608, 800] },
    ],
    floors: [
      { kind: "tile", rect: [493, 115, 202, 263] },
      { kind: "balcony", rect: [50, 800, 645, 125] },
    ],
    furniture: [
      { kind: "rug", rect: [154, 403, 173, 245] },
      { kind: "rug", rect: [447, 443, 215, 255] },
      { kind: "rug", rect: [304, 838, 213, 63] },
      // Sink at the top, hob near the middle, an under-counter appliance at the end.
      { kind: "kitchen", rect: [80, 237, 55, 248], rotation: 270, fittings: { hob: 0.03, sink: 0.395 } },
      { kind: "wardrobe", rect: [83, 491, 49, 246], rotation: 270 },
      { kind: "sofa", rect: [149, 414, 80, 231], rotation: 270 },
      { kind: "table", rect: [246, 481, 62, 115], shape: "round" },
      { kind: "media", rect: [358, 416, 27, 222], rotation: 90 },
      { kind: "dining", rect: [178, 670, 65, 106], shape: "round" },
      { kind: "chair", rect: [148, 697, 29, 56], rotation: 270 },
      { kind: "chair", rect: [242, 697, 27, 56], rotation: 90 },
      { kind: "bed", rect: [479, 473, 183, 188], rotation: 90 },
      { kind: "nightstand", rect: [622, 438, 36, 34], shape: "round" },
      { kind: "nightstand", rect: [622, 661, 36, 40], shape: "round" },
      { kind: "shelving", rect: [665, 451, 18, 275], rotation: 90 },
      { kind: "bathtub", rect: [505, 300, 166, 60], rotation: 90 },
      { kind: "vanity", rect: [620, 205, 37, 70], rotation: 90 },
      { kind: "toilet", rect: [599, 147, 58, 40], rotation: 90 },
      { kind: "armchair", rect: [579, 841, 68, 64], rotation: 45 },
      { kind: "sideTable", rect: [540, 856, 37, 30] },
      { kind: "plant", rect: [79, 842, 48, 60] },
      { kind: "plant", rect: [83, 748, 37, 39] },
    ],
    viewpoints: [
      { id: "living", position: [333, 663], target: [185, 501] },
      { id: "bedroom", position: [466, 704], target: [586, 559] },
      { id: "kitchen", position: [280, 325], target: [109, 327] },
      { id: "bathroom", position: [528, 245], target: [650, 200] },
    ],
  }),
  trace({
    // Apartments 507, 607 and 708: 48.9 m² inside and a 6.2 m² balcony.
    id: "parnavaz-55-10",
    area: 55.1,
    bedrooms: 1,
    source: {
      src: "/images/projects/parnavaz-65/layouts/55-10.jpg",
      width: 1017,
      height: 1268,
      crop: [22, 83, 720, 878],
    },
    calibration: [{
      x: [[50, 0], [692, 6.4]],
      z: [[121, 0], [283, 1.93], [819, 7.8], [935, 8.86]],
    }],
    // 3D only: opens the passage between the coffee table and the kitchen.
    widen: { x: [[600, 0.35]] },
    footprint: [
      [50, 121], [542, 121], [542, 105], [704, 105],
      [704, 281], [692, 281], [692, 935], [50, 935],
    ],
    walls: [
      [[50, 121], [440, 121]],
      [[539, 121], [549, 121]],
      [[549, 105], [611, 105]],
      [[684, 105], [704, 105]],
      [[704, 105], [704, 281]],
      [[692, 281], [692, 819]],
      // A solid party wall on the plan; the board's pale strip is cladding.
      [[50, 121], [50, 819]],
      [[50, 819], [140, 819]],
      [[255, 819], [359, 819]],
      [[610, 819], [692, 819]],
      [[50, 819], [50, 935]],
      [[692, 819], [692, 935]],
      [[320, 138], [320, 167]],
      [[320, 229], [320, 283]],
      [[69, 283], [438, 283]],
      [[357, 283], [357, 321]],
      [[357, 383], [357, 819]],
    ],
    columns: [[52, 140], [704, 122], [52, 733], [692, 737]],
    openings: [
      { kind: "entrance", from: [611, 105], to: [684, 105], hinge: "to", swing: 1 },
      { kind: "window", from: [440, 121], to: [539, 121] },
      // The bathroom door opens out into the hall.
      { kind: "door", from: [320, 167], to: [320, 229], hinge: "to", swing: -1 },
      { kind: "door", from: [357, 321], to: [357, 383], hinge: "from", swing: 1 },
      { kind: "balcony", from: [140, 819], to: [255, 819] },
      { kind: "glazing", from: [359, 819], to: [492, 819] },
      { kind: "balcony", from: [492, 819], to: [610, 819] },
    ],
    floors: [
      { kind: "tile", rect: [50, 121, 270, 162] },
      { kind: "balcony", rect: [50, 819, 642, 116] },
    ],
    furniture: [
      { kind: "rug", rect: [87, 395, 225, 320] },
      { kind: "rug", rect: [462, 418, 115, 263] },
      { kind: "rug", rect: [574, 200, 78, 50] },
      { kind: "rug", rect: [330, 855, 165, 63] },
      { kind: "bathtub", rect: [85, 144, 68, 128] },
      { kind: "vanity", rect: [239, 145, 48, 41] },
      { kind: "toilet", rect: [268, 231, 34, 42], rotation: 180 },
      { kind: "plant", rect: [162, 225, 34, 44] },
      { kind: "rug", rect: [205, 213, 47, 55] },
      { kind: "console", rect: [660, 180, 29, 85], rotation: 90 },
      { kind: "bed", rect: [87, 446, 200, 212], rotation: 270 },
      { kind: "nightstand", rect: [89, 406, 37, 36], shape: "round" },
      { kind: "nightstand", rect: [89, 667, 37, 35], shape: "round" },
      { kind: "shelving", rect: [65, 323, 18, 388], rotation: 270 },
      { kind: "sofa", rect: [385, 406, 85, 282], rotation: 270 },
      { kind: "table", rect: [496, 502, 76, 93], shape: "round" },
      // Sink at the top of the run, hob in the middle, an under-counter
      // appliance at the bottom.
      { kind: "kitchen", rect: [625, 287, 53, 317], rotation: 90, fittings: { hob: -0.01, sink: -0.38 } },
      { kind: "media", rect: [623, 613, 42, 168], rotation: 90 },
      { kind: "table", rect: [437, 714, 130, 56] },
      { kind: "armchair", rect: [551, 845, 66, 75], rotation: 45 },
      { kind: "sideTable", rect: [504, 860, 38, 38] },
      { kind: "plant", rect: [73, 716, 41, 58] },
      { kind: "plant", rect: [80, 858, 45, 60] },
      { kind: "plant", rect: [613, 853, 39, 61] },
    ],
    viewpoints: [
      { id: "living", position: [576, 676], target: [431, 526] },
      { id: "bedroom", position: [315, 730], target: [192, 550] },
      { id: "kitchen", position: [528, 339], target: [648, 392] },
      { id: "bathroom", position: [290, 200], target: [110, 190] },
    ],
  }),
  trace({
    // Apartments 301, 401, 501, 601 and 701: 48.8 m² inside and a 6.5 m²
    // balcony along the top facade.
    id: "parnavaz-55-30",
    area: 55.3,
    bedrooms: 2,
    source: {
      src: "/images/projects/parnavaz-65/layouts/55-30.jpg",
      width: 1280,
      height: 915,
      crop: [24, 96, 888, 595],
    },
    calibration: [{
      x: [[45, 0], [328, 3.05], [601, 6.06], [894, 9.46]],
      z: [[108, -0.75], [191, 0], [499, 3.55], [660, 5.5]],
    }],
    // 3D only: opens the living room between the TV and the sofa.
    widen: { x: [[670, 0.35]] },
    footprint: [[45, 108], [894, 108], [894, 667], [45, 667]],
    walls: [
      [[45, 108], [45, 667]],
      [[894, 108], [894, 667]],
      [[45, 191], [130, 191]],
      [[233, 191], [416, 191]],
      [[511, 191], [698, 191]],
      [[799, 191], [894, 191]],
      [[45, 660], [389, 660]],
      [[493, 660], [894, 660]],
      [[328, 201], [328, 499]],
      [[601, 201], [601, 545]],
      [[53, 499], [248, 499]],
      [[303, 499], [348, 499]],
      [[405, 499], [601, 499]],
      // The shower's hall-side walls; its bathroom side is a glass screen.
      [[232, 566], [338, 566]],
      [[338, 566], [338, 651]],
    ],
    columns: [[30, 308, 34, 52], [30, 570, 34, 66], [592, 302, 36, 95]],
    openings: [
      { kind: "entrance", from: [389, 660], to: [493, 660], hinge: "to", swing: -1 },
      { kind: "door", from: [248, 499], to: [303, 499], hinge: "to", swing: -1 },
      { kind: "door", from: [348, 499], to: [405, 499], hinge: "from", swing: -1 },
      { kind: "door", from: [232, 505], to: [232, 559], hinge: "to", swing: 1 },
      { kind: "balcony", from: [130, 191], to: [233, 191] },
      { kind: "balcony", from: [416, 191], to: [511, 191] },
      { kind: "balcony", from: [698, 191], to: [799, 191] },
    ],
    floors: [
      // The bathroom and its shower; the strip by the bathroom door is hall.
      { kind: "tile", rect: [45, 505, 187, 150] },
      { kind: "tile", rect: [232, 566, 106, 89] },
      { kind: "balcony", rect: [45, 108, 849, 83] },
    ],
    furniture: [
      { kind: "rug", rect: [116, 273, 168, 213] },
      { kind: "rug", rect: [386, 273, 175, 205] },
      { kind: "rug", rect: [662, 272, 180, 230] },
      { kind: "bed", rect: [88, 293, 165, 152], rotation: 270 },
      // Round side tables with plants either side of bed 1.
      { kind: "sideTable", rect: [89, 251, 32, 37] },
      { kind: "sideTable", rect: [89, 438, 30, 33] },
      { kind: "shelving", rect: [66, 241, 20, 241], rotation: 270 },
      { kind: "bed", rect: [411, 296, 149, 149], rotation: 90 },
      { kind: "nightstand", rect: [532, 253, 31, 41] },
      { kind: "nightstand", rect: [532, 445, 31, 37] },
      { kind: "shelving", rect: [566, 223, 23, 261], rotation: 90 },
      { kind: "sofa", rect: [763, 288, 75, 204], rotation: 90 },
      { kind: "table", rect: [692, 326, 64, 104], shape: "round" },
      // The board also draws a TV on this console; it would face the sofa's back.
      { kind: "console", rect: [844, 305, 29, 190], rotation: 90 },
      // Built in along the wall and around the shaft; the TV hangs on the shaft.
      { kind: "media", rect: [607, 272, 40, 220], rotation: 270 },
      { kind: "kitchen", rect: [538, 600, 291, 46], rotation: 180 },
      { kind: "fridge", rect: [830, 554, 48, 90], rotation: 90 },
      { kind: "toilet", rect: [73, 528, 51, 42], rotation: 270 },
      { kind: "vanity", rect: [78, 582, 66, 50], rotation: 270 },
      { kind: "plant", rect: [148, 590, 34, 40] },
      { kind: "shower", rect: [237, 572, 96, 72], rotation: 90 },
      { kind: "plant", rect: [829, 237, 42, 48] },
      { kind: "plant", rect: [87, 125, 35, 51] },
      { kind: "plant", rect: [813, 123, 47, 54] },
      { kind: "armchair", rect: [132, 129, 47, 46], rotation: 45 },
    ],
    viewpoints: [
      { id: "living", position: [714, 539], target: [803, 373] },
      { id: "bedroom", position: [286, 409], target: [170, 366] },
      { id: "bedroom2", position: [369, 409], target: [477, 366] },
      { id: "kitchen", position: [705, 468], target: [690, 625] },
      { id: "bathroom", position: [205, 600], target: [80, 560] },
    ],
  }),
  trace({
    // Apartment 605: 71.1 m² inside and a 5.3 m² balcony off the living room.
    id: "parnavaz-76-40",
    area: 76.4,
    bedrooms: 2,
    source: {
      src: "/images/projects/parnavaz-65/layouts/76-40.jpg",
      width: 1280,
      height: 930,
      crop: [19, 90, 803, 657],
    },
    calibration: [{
      x: [[47, 0], [353, 4.26], [550, 7.34], [804, 10.7]],
      z: [[105, 0], [298, 1.96], [607, 6.26], [704, 7.45], [730, 7.7]],
    }],
    // 3D only: opens the kitchen-to-dining aisle and bedroom 1 beside the bed.
    widen: { x: [[405, 0.3]], z: [[210, 0.4]] },
    footprint: [
      [46, 105], [804, 105], [804, 713],
      [348, 713], [348, 730], [45, 730],
    ],
    walls: [
      [[47, 105], [476, 105]],
      [[549, 105], [641, 105]],
      [[764, 105], [804, 105]],
      [[47, 105], [47, 607]],
      [[804, 105], [804, 704]],
      [[47, 607], [122, 607]],
      [[320, 607], [353, 607]],
      [[47, 607], [47, 730]],
      [[344, 607], [344, 730]],
      [[353, 704], [394, 704]],
      [[514, 704], [598, 704]],
      [[735, 704], [804, 704]],
      [[430, 113], [430, 196]],
      [[430, 267], [430, 298]],
      [[353, 298], [486, 298]],
      [[353, 298], [353, 692]],
      [[550, 298], [550, 704]],
      [[616, 298], [804, 298]],
      [[596, 113], [596, 174]],
      [[596, 228], [596, 237]],
      [[622, 237], [622, 298]],
    ],
    columns: [[55, 120], [50, 600], [355, 600], [796, 120]],
    openings: [
      { kind: "entrance", from: [476, 105], to: [549, 105], hinge: "from", swing: 1 },
      { kind: "window", from: [641, 105], to: [764, 105] },
      { kind: "door", from: [430, 196], to: [430, 267], hinge: "from", swing: 1 },
      { kind: "door", from: [596, 174], to: [596, 228], hinge: "from", swing: -1 },
      { kind: "door", from: [486, 298], to: [550, 298], hinge: "from", swing: 1 },
      { kind: "door", from: [550, 298], to: [616, 298], hinge: "from", swing: 1 },
      // The balcony door at the left, then fixed glass to the column.
      { kind: "balcony", from: [122, 607], to: [192, 607] },
      { kind: "glazing", from: [192, 607], to: [320, 607] },
      { kind: "window", from: [394, 704], to: [514, 704] },
      { kind: "window", from: [598, 704], to: [735, 704] },
    ],
    floors: [
      { kind: "tile", rect: [596, 105, 208, 193] },
      { kind: "balcony", rect: [45, 607, 303, 123] },
    ],
    furniture: [
      { kind: "rug", rect: [162, 365, 102, 185] },
      { kind: "rug", rect: [489, 187, 52, 78] },
      { kind: "rug", rect: [395, 383, 118, 252], shape: "round" },
      { kind: "rug", rect: [591, 385, 135, 255] },
      { kind: "fridge", rect: [88, 126, 38, 61] },
      { kind: "kitchen", rect: [126, 126, 297, 61] },
      { kind: "dining", rect: [110, 247, 111, 63] },
      { kind: "chair", rect: [119, 229, 44, 23] },
      { kind: "chair", rect: [171, 229, 42, 23] },
      { kind: "chair", rect: [118, 309, 44, 30], rotation: 180 },
      { kind: "chair", rect: [174, 309, 43, 30], rotation: 180 },
      { kind: "chair", rect: [73, 257, 37, 51], rotation: 270 },
      { kind: "sofa", rect: [264, 330, 80, 241], rotation: 90 },
      { kind: "table", rect: [180, 380, 51, 147] },
      { kind: "media", rect: [72, 352, 36, 192], rotation: 270 },
      { kind: "plant", rect: [70, 537, 38, 48] },
      { kind: "plant", rect: [72, 317, 30, 30] },
      { kind: "console", rect: [439, 145, 16, 70], rotation: 270 },
      { kind: "bed", rect: [419, 420, 118, 166], rotation: 90 },
      { kind: "nightstand", rect: [515, 365, 25, 50] },
      { kind: "nightstand", rect: [515, 575, 25, 45] },
      // Along bedroom 1's left wall: a cabinet, a vase and a long dresser.
      { kind: "console", rect: [368, 323, 26, 58], rotation: 270 },
      { kind: "plant", rect: [372, 483, 18, 30] },
      { kind: "console", rect: [368, 513, 26, 130], rotation: 270 },
      { kind: "bed", rect: [623, 416, 155, 184], rotation: 90 },
      { kind: "nightstand", rect: [763, 352, 24, 60] },
      { kind: "nightstand", rect: [752, 580, 35, 48] },
      { kind: "plant", rect: [729, 606, 22, 26] },
      { kind: "bathtub", rect: [635, 241, 116, 48], rotation: 90 },
      { kind: "vanity", rect: [650, 123, 63, 38] },
      { kind: "toilet", rect: [721, 180, 45, 34], rotation: 90 },
      { kind: "ledge", rect: [765, 168, 28, 65], rotation: 90 },
      { kind: "plant", rect: [718, 122, 26, 36] },
      { kind: "shelving", rect: [763, 237, 30, 51], rotation: 90 },
      { kind: "armchair", rect: [85, 642, 86, 71], rotation: 15 },
      { kind: "sideTable", rect: [186, 661, 44, 45] },
      { kind: "plant", rect: [278, 649, 46, 53] },
      { kind: "plant", rect: [728, 640, 44, 44] },
      { kind: "plant", rect: [74, 215, 30, 30] },
    ],
    viewpoints: [
      { id: "living", position: [150, 533], target: [307, 426] },
      { id: "bedroom", position: [417, 654], target: [480, 501] },
      { id: "bedroom2", position: [602, 654], target: [705, 501] },
      { id: "kitchen", position: [300, 285], target: [262, 150] },
      { id: "bathroom", position: [665, 205], target: [700, 140] },
    ],
  }),
  trace({
    // Apartments 508, 608 and 709: 100.1 m² inside with 6.4 m² and 10.5 m²
    // balconies. The board's rooms are proportioned differently from the
    // plan, so each room group has its own calibration zone. Balcony outer
    // edges are railings, so they are not traced as walls.
    id: "parnavaz-117",
    area: 117,
    bedrooms: 2,
    source: {
      src: "/images/projects/parnavaz-65/layouts/117.jpg",
      width: 1280,
      height: 878,
      crop: [27, 82, 729, 774],
    },
    calibration: [
      // Bedroom 1, beside the kitchen.
      { within: [0, 0, 406, 296.5], x: [[32, -0.62], [107, 0], [404, 6.16]], z: [[92, -0.7], [107, 0], [296, 3.09]] },
      // Kitchen and bathroom along the top facade.
      { within: [406, 0, 800, 300], x: [[404, 6.16], [609, 10.65], [741, 12.81]], z: [[92, -0.7], [107, 0], [297, 2.86]] },
      // Bedroom 2.
      { within: [0, 296.5, 391.5, 470], x: [[32, -0.62], [107, 0], [391, 4.86]], z: [[296, 3.09], [466, 6.16]] },
      // The hall strip between bedroom 2 and the kitchen.
      { within: [391.5, 300, 464, 476], x: [[391, 4.86], [464, 6.2]], z: [[297, 2.86], [377, 4.4], [466, 6.16], [476, 6.3]] },
      // The entrance hall below the kitchen and bathroom.
      { within: [464, 300, 800, 470], x: [[464, 6.2], [741, 12.81]], z: [[297, 2.86], [377, 4.4], [381, 4.46]] },
      // Living room and both lower balconies.
      { x: [[32, -0.62], [63, -0.25], [128, 0.2], [465, 6.2]], z: [[466, 6.16], [476, 6.3], [758, 11.81], [838, 12.63]] },
    ],
    footprint: [
      [32, 137], [98, 137], [98, 107], [433, 107],
      [433, 92], [608, 92], [608, 107], [741, 107],
      [741, 381], [464, 381], [464, 838], [63, 838],
      [63, 477], [32, 477],
    ],
    walls: [
      [[98, 107], [433, 107]],
      [[433, 92], [608, 92]],
      [[433, 92], [433, 107]],
      [[608, 92], [608, 107]],
      [[608, 107], [741, 107]],
      [[741, 107], [741, 309]],
      [[741, 365], [741, 377]],
      [[455, 377], [741, 377]],
      [[455, 377], [455, 440]],
      [[465, 476], [465, 747]],
      // Bedroom balcony sides: wall, glazed doors and fixed glass between columns.
      [[107, 120], [107, 155]],
      [[107, 242], [107, 247]],
      [[107, 290], [107, 302]],
      [[107, 442], [107, 462]],
      [[404, 126], [404, 251]],
      [[111, 296], [398, 296]],
      [[391, 313], [391, 405]],
      [[391, 455], [391, 466]],
      // Behind the sofa: a solid wall from the corner column to the hall door.
      [[107, 466], [397, 466]],
      [[445, 466], [464, 466]],
      [[457, 297], [610, 297]],
      [[609, 109], [609, 290]],
      [[660, 297], [741, 297]],
      [[128, 476], [128, 575]],
      [[128, 720], [128, 758]],
      [[128, 758], [150, 758]],
      [[420, 758], [464, 758]],
      [[32, 137], [98, 137]],
      [[32, 477], [63, 477]],
      [[464, 758], [464, 838]],
    ],
    openings: [
      { kind: "entrance", from: [741, 309], to: [741, 365], hinge: "to", swing: 1 },
      { kind: "door", from: [404, 251], to: [404, 296], hinge: "to", swing: 1 },
      { kind: "door", from: [391, 405], to: [391, 455], hinge: "to", swing: 1 },
      { kind: "door", from: [410, 297], to: [457, 297], hinge: "from", swing: -1 },
      { kind: "door", from: [610, 297], to: [660, 297], hinge: "from", swing: -1 },
      // Hall to living room, hung on the column side and opening into the room.
      { kind: "door", from: [397, 466], to: [445, 466], hinge: "to", swing: 1 },
      { kind: "balcony", from: [107, 155], to: [107, 242] },
      { kind: "glazing", from: [107, 247], to: [107, 290] },
      { kind: "glazing", from: [107, 302], to: [107, 330] },
      { kind: "balcony", from: [107, 330], to: [107, 400] },
      { kind: "glazing", from: [107, 408], to: [107, 442] },
      { kind: "balcony", from: [128, 575], to: [128, 620] },
      { kind: "glazing", from: [128, 620], to: [128, 720] },
      { kind: "glazing", from: [150, 758], to: [278, 758] },
      { kind: "balcony", from: [278, 758], to: [322, 758] },
      { kind: "glazing", from: [322, 758], to: [420, 758] },
    ],
    columns: [[113, 113], [418, 107], [733, 113], [130, 463], [466, 460], [131, 742], [466, 742]],
    floors: [
      { kind: "tile", rect: [609, 107, 132, 190] },
      { kind: "balcony", rect: [32, 137, 75, 340] },
      { kind: "balcony", rect: [63, 477, 65, 361] },
      { kind: "balcony", rect: [128, 758, 336, 80] },
    ],
    furniture: [
      { kind: "rug", rect: [162, 174, 160, 118] },
      { kind: "rug", rect: [159, 344, 163, 113] },
      { kind: "rug", rect: [154, 512, 230, 202] },
      { kind: "bed", rect: [192, 136, 98, 136] },
      { kind: "nightstand", rect: [155, 132, 35, 36] },
      { kind: "nightstand", rect: [291, 132, 34, 36] },
      { kind: "wardrobe", rect: [369, 136, 27, 105], rotation: 90 },
      { kind: "console", rect: [128, 128, 24, 46], rotation: 270 },
      { kind: "bed", rect: [190, 315, 98, 131] },
      { kind: "nightstand", rect: [155, 312, 34, 34] },
      { kind: "nightstand", rect: [290, 312, 34, 34] },
      { kind: "wardrobe", rect: [362, 318, 27, 93], rotation: 90 },
      // Fridge on the bedroom-side wall below the corner column, then the
      // run in the 0.70 m bay and its return with the hob and dishwasher.
      { kind: "fridge", rect: [410, 124, 33, 67], rotation: 270 },
      { kind: "kitchen", rect: [433, 94.5, 173, 14.5] },
      { kind: "kitchen", rect: [575, 109, 31, 179], rotation: 90 },
      { kind: "bathtub", rect: [684, 147, 44, 122] },
      { kind: "toilet", rect: [630, 136, 23, 44] },
      { kind: "vanity", rect: [615, 197, 29, 40], rotation: 270 },
      { kind: "plant", rect: [672, 339, 30, 30] },
      { kind: "sofa", rect: [153, 503, 198, 59] },
      { kind: "sofa", rect: [153, 562, 64, 134], rotation: 270 },
      { kind: "table", rect: [239, 583, 62, 62], shape: "round" },
      { kind: "dining", rect: [303, 630, 93, 87], shape: "round" },
      // Seven chairs evenly spaced around the round table, each facing it.
      { kind: "chair", rect: [333.6, 613.1, 25.8, 23.5] },
      { kind: "chair", rect: [375.3, 631.4, 25.8, 23.5], rotation: 51 },
      { kind: "chair", rect: [385.6, 672.5, 25.8, 23.5], rotation: 103 },
      { kind: "chair", rect: [356.7, 705.5, 25.8, 23.5], rotation: 154 },
      { kind: "chair", rect: [310.4, 705.5, 25.8, 23.5], rotation: 206 },
      { kind: "chair", rect: [281.6, 672.5, 25.8, 23.5], rotation: 257 },
      { kind: "chair", rect: [291.9, 631.4, 25.8, 23.5], rotation: 309 },
      { kind: "media", rect: [430, 540, 25, 185], rotation: 90 },
      { kind: "plant", rect: [146, 712, 26, 34] },
      { kind: "armchair", rect: [368, 776, 52, 52], rotation: 30 },
      { kind: "sideTable", rect: [346, 790, 24, 24] },
      { kind: "armchair", rect: [49, 395, 42, 37], rotation: 45 },
      { kind: "plant", rect: [51, 174, 37, 45] },
      { kind: "plant", rect: [52, 287, 37, 41] },
      { kind: "plant", rect: [53, 436, 30, 34] },
      { kind: "plant", rect: [82, 782, 32, 42] },
      { kind: "plant", rect: [113, 789, 24, 30] },
      { kind: "plant", rect: [138, 787, 25, 32] },
      { kind: "plant", rect: [415, 784, 28, 32] },
    ],
    viewpoints: [
      // Just inside the hall door, looking over the sofa, table and glazing.
      { id: "living", position: [418, 505], target: [250, 690] },
      { id: "bedroom", position: [333, 237], target: [239, 187] },
      { id: "bedroom2", position: [328, 405], target: [237, 365] },
      { id: "kitchen", position: [482, 250], target: [520, 150] },
      { id: "bathroom", position: [640, 270], target: [650, 150] },
    ],
  }),
];

/**
 * Apartments within this many m² of a designed type are shown with that
 * type's design; anything further from every board has no model.
 */
export const SIMILAR_AREA_TOLERANCE = 2.5;

/** The designed type for an apartment: its own board, else the nearest close one. */
export function getParnavazApartmentModel(
  area: number,
): ApartmentModel | undefined {
  let nearest: ApartmentModel | undefined;
  for (const model of PARNAVAZ_APARTMENT_MODELS) {
    const gap = Math.abs(model.area - area);
    if (gap <= SIMILAR_AREA_TOLERANCE + 1e-9 && (!nearest || gap < Math.abs(nearest.area - area))) nearest = model;
  }
  return nearest;
}
