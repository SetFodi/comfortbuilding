import type {
  ApartmentModel,
  FurnitureKind,
  PlanPoint,
} from "./apartment-model";

export interface WalkthroughPoint {
  readonly x: number;
  readonly z: number;
}

export interface WalkthroughLayout {
  readonly width: number;
  readonly depth: number;
  readonly footprint: readonly WalkthroughPoint[];
  readonly walls: readonly {
    readonly start: WalkthroughPoint;
    readonly end: WalkthroughPoint;
    readonly thickness: number;
  }[];
  readonly obstacles: readonly {
    readonly minX: number;
    readonly minZ: number;
    readonly maxX: number;
    readonly maxZ: number;
    readonly kind: FurnitureKind | "column";
  }[];
}

const PERSON_RADIUS = 0.16;
const WALL_THICKNESS = 0.115;
const EPSILON = 1e-10;

function finite(point: WalkthroughPoint): boolean {
  return Number.isFinite(point.x) && Number.isFinite(point.z);
}

function worldPoint(
  point: PlanPoint,
  layout: Pick<WalkthroughLayout, "width" | "depth">,
): WalkthroughPoint {
  return {
    x: (point[0] - 0.5) * layout.width,
    z: (point[1] - 0.5) * layout.depth,
  };
}

/** Uses the same ground plane and real metre scale as the apartment renderer. */
export function createWalkthroughLayout(
  model: ApartmentModel,
): WalkthroughLayout {
  const { width, depth } = model.size;
  if (
    !Number.isFinite(width) || !Number.isFinite(depth)
    || width <= 0 || depth <= 0 || model.footprint.length < 3
  ) {
    throw new RangeError("The apartment needs a valid floor area and footprint.");
  }
  const dimensions = { width, depth };
  const obstacles: WalkthroughLayout["obstacles"][number][] = [];
  for (const furniture of model.furniture) {
    const [left, top, normalizedWidth, normalizedDepth] = furniture.rect;
    const furnitureWidth = normalizedWidth * width;
    const furnitureDepth = normalizedDepth * depth;
    // Rugs, plant foliage and very small accents should not trap a person.
    if (
      furniture.kind === "plant" || furniture.kind === "rug"
      || furnitureWidth * furnitureDepth < 0.08
    ) continue;
    const origin = worldPoint([left, top], dimensions);
    obstacles.push({
      minX: origin.x,
      minZ: origin.z,
      maxX: origin.x + furnitureWidth,
      maxZ: origin.z + furnitureDepth,
      kind: furniture.kind,
    });
  }
  for (const [left, top, columnWidth, columnDepth] of model.columns ?? []) {
    const origin = worldPoint([left, top], dimensions);
    obstacles.push({
      minX: origin.x,
      minZ: origin.z,
      maxX: origin.x + columnWidth * width,
      maxZ: origin.z + columnDepth * depth,
      kind: "column",
    });
  }
  // Fixed glass and window sills are as solid as the walls around them.
  const solid = [
    ...model.walls,
    ...model.openings
      .filter(({ kind }) => kind === "glazing" || kind === "window")
      .map(({ from, to }) => [from, to] as const),
  ];
  return {
    ...dimensions,
    footprint: model.footprint.map((point) => worldPoint(point, dimensions)),
    walls: solid.map(([start, end]) => ({
      start: worldPoint(start, dimensions),
      end: worldPoint(end, dimensions),
      thickness: WALL_THICKNESS,
    })),
    // Source rectangles already describe the final rotated footprint.
    obstacles,
  };
}

function segmentDistanceSquared(
  point: WalkthroughPoint,
  start: WalkthroughPoint,
  end: WalkthroughPoint,
): number {
  const dx = end.x - start.x;
  const dz = end.z - start.z;
  const lengthSquared = dx * dx + dz * dz;
  const t = lengthSquared > 0
    ? Math.max(0, Math.min(1, (
      (point.x - start.x) * dx + (point.z - start.z) * dz
    ) / lengthSquared))
    : 0;
  return (point.x - start.x - t * dx) ** 2
    + (point.z - start.z - t * dz) ** 2;
}

function insideFootprint(
  point: WalkthroughPoint,
  footprint: readonly WalkthroughPoint[],
): boolean {
  let inside = false;
  for (
    let current = 0, previous = footprint.length - 1;
    current < footprint.length;
    previous = current, current += 1
  ) {
    const a = footprint[current];
    const b = footprint[previous];
    if (
      (a.z > point.z) !== (b.z > point.z)
      && point.x < (b.x - a.x) * (point.z - a.z) / (b.z - a.z) + a.x
    ) inside = !inside;
  }
  return inside;
}

/** Tests the person's whole ground-plane circle, including balcony edges. */
export function canWalkTo(
  layout: WalkthroughLayout,
  position: WalkthroughPoint,
  radius = PERSON_RADIUS,
): boolean {
  if (
    !finite(position) || !Number.isFinite(radius) || radius < 0
    || !insideFootprint(position, layout.footprint)
  ) return false;
  const radiusSquared = radius * radius;
  for (let index = 0; index < layout.footprint.length; index += 1) {
    if (
      segmentDistanceSquared(
        position,
        layout.footprint[index],
        layout.footprint[(index + 1) % layout.footprint.length],
      ) < radiusSquared - EPSILON
    ) return false;
  }
  for (const wall of layout.walls) {
    const clearance = radius + wall.thickness / 2;
    if (
      segmentDistanceSquared(position, wall.start, wall.end)
      < clearance * clearance - EPSILON
    ) return false;
  }
  for (const obstacle of layout.obstacles) {
    const dx = Math.max(obstacle.minX - position.x, 0, position.x - obstacle.maxX);
    const dz = Math.max(obstacle.minZ - position.z, 0, position.z - obstacle.maxZ);
    if (dx * dx + dz * dz < radiusSquared - EPSILON) return false;
    // A zero-radius diagnostic point still cannot stand inside solid furniture.
    if (
      position.x > obstacle.minX && position.x < obstacle.maxX
      && position.z > obstacle.minZ && position.z < obstacle.maxZ
    ) return false;
  }
  return true;
}

/**
 * Moves by a world-space displacement. The caller owns speed, elapsed time and
 * input-vector normalization. Short collision steps prevent frame stalls from
 * carrying a person through a wall; blocked motion continues along a clear axis.
 */
export function moveWalkthrough(
  layout: WalkthroughLayout,
  position: WalkthroughPoint,
  displacement: WalkthroughPoint,
  radius = PERSON_RADIUS,
): WalkthroughPoint {
  if (
    !finite(displacement) || !canWalkTo(layout, position, radius)
  ) return { ...position };
  const distance = Math.hypot(displacement.x, displacement.z);
  if (distance === 0) return { ...position };

  // No useful single movement inside this apartment needs an unbounded path.
  const travel = Math.min(distance, Math.hypot(layout.width, layout.depth) * 2);
  const stepLength = Math.min(0.04, Math.max(0.01, radius / 2));
  const steps = Math.ceil(travel / stepLength);
  const factor = travel / distance / steps;
  const step = { x: displacement.x * factor, z: displacement.z * factor };
  let current = { ...position };
  for (let index = 0; index < steps; index += 1) {
    const combined = { x: current.x + step.x, z: current.z + step.z };
    if (canWalkTo(layout, combined, radius)) {
      current = combined;
      continue;
    }
    // Try the larger component first to keep sliding consistent with intent.
    const axes: readonly ("x" | "z")[] = Math.abs(step.x) >= Math.abs(step.z)
      ? ["x", "z"]
      : ["z", "x"];
    for (const axis of axes) {
      if (step[axis] === 0) continue;
      const candidate = { ...current, [axis]: current[axis] + step[axis] };
      if (canWalkTo(layout, candidate, radius)) current = candidate;
    }
  }
  return current;
}

function clearSpawn(
  layout: WalkthroughLayout,
  preferred: WalkthroughPoint,
): WalkthroughPoint {
  if (canWalkTo(layout, preferred)) return preferred;
  const spacing = 0.08;
  const maxRing = Math.ceil(Math.hypot(layout.width, layout.depth) / spacing);
  for (let ring = 1; ring <= maxRing; ring += 1) {
    let closest: WalkthroughPoint | undefined;
    let closestDistance = Infinity;
    const consider = (x: number, z: number) => {
      const candidate = {
        x: preferred.x + x * spacing,
        z: preferred.z + z * spacing,
      };
      const distance = x * x + z * z;
      if (distance < closestDistance && canWalkTo(layout, candidate)) {
        closest = candidate;
        closestDistance = distance;
      }
    };
    for (let offset = -ring; offset <= ring; offset += 1) {
      consider(offset, -ring);
      consider(offset, ring);
      if (Math.abs(offset) !== ring) {
        consider(-ring, offset);
        consider(ring, offset);
      }
    }
    if (closest) return closest;
  }
  throw new RangeError("This apartment has no clear walkthrough starting point.");
}

/** Finds a safe room start without moving or rewriting the supplied geometry. */
export function walkthroughSpawn(
  model: ApartmentModel,
  roomId?: string,
): { readonly position: WalkthroughPoint; readonly target: WalkthroughPoint } {
  const layout = createWalkthroughLayout(model);
  const room = model.viewpoints.find((item) => item.id === roomId)
    ?? model.viewpoints.find((item) => item.id === "living")
    ?? model.viewpoints[0];
  const preferred = room
    ? worldPoint(room.position, layout)
    : { x: 0, z: 0 };
  const position = clearSpawn(layout, preferred);
  const target = room
    ? worldPoint(room.target, layout)
    : { x: position.x, z: position.z - 0.1 };
  return {
    position,
    target: Math.hypot(target.x - position.x, target.z - position.z) > EPSILON
      ? target
      : { x: position.x, z: position.z - 0.1 },
  };
}
