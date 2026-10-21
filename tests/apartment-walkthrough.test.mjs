import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { runInThisContext } from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
function loadSource(path) {
  const filename = fileURLToPath(new URL(`../${path}`, import.meta.url));
  const source = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: filename,
  }).outputText;
  const loaded = { exports: {} };
  runInThisContext(`(function(module, exports, require) {\n${source}\n})`, {
    filename,
  })(loaded, loaded.exports, require);
  return loaded.exports;
}

const { boardToNormalized, getParnavazApartmentModel, PARNAVAZ_APARTMENT_MODELS } = loadSource("src/lib/parnavaz-apartment-models.ts");
const {
  createWalkthroughLayout,
  canWalkTo,
  moveWalkthrough,
  walkthroughSpawn,
} = loadSource("src/lib/apartment-walkthrough.ts");
const model = getParnavazApartmentModel(46.5);
assert.ok(model);
const layout = createWalkthroughLayout(model);

/** Board pixel to world metres through a model's calibration and widening. */
function world(x, y, currentModel = model, currentLayout = layout) {
  return calibratedWorld(x, y, currentModel, currentLayout);
}

function calibratedWorld(x, y, currentModel, currentLayout) {
  const [nx, nz] = boardToNormalized(currentModel, [x, y]);
  return { x: (nx - 0.5) * currentLayout.width, z: (nz - 0.5) * currentLayout.depth };
}

function displacement(start, end) {
  return { x: end.x - start.x, z: end.z - start.z };
}

function near(actual, expected, tolerance = 1e-8) {
  assert.ok(
    Math.hypot(actual.x - expected.x, actual.z - expected.z) < tolerance,
    `${JSON.stringify(actual)} is near ${JSON.stringify(expected)}`,
  );
}

test("the 46.5 m² walkthrough uses the scene's world scale and clear room starts", () => {
  // Measured on the architectural plan: 6.40 m between side-wall centres and
  // 6.90 m from the corridor wall to the facade, mapped linearly over the
  // crop, plus the walkway space the 3D view adds (0.25 m and 0.40 m).
  assert.deepEqual(layout.width, model.size.width);
  assert.deepEqual(layout.depth, model.size.depth);
  assert.ok(Math.abs(layout.width - (702 / 648 * 6.4 + 0.25)) < 1e-9);
  assert.ok(Math.abs(layout.depth - (860 / 720 * 6.9 + 0.4)) < 1e-9);
  // Widening moves walls apart, not furniture sizes.
  const bed = model.furniture.find((item) => item.kind === "bed");
  assert.ok(Math.abs(bed.rect[2] * layout.width - 167 / 648 * 6.4) < 1e-9);
  assert.ok(layout.walls.every((wall) => wall.thickness === 0.115));
  assert.ok(layout.obstacles.every((obstacle) => obstacle.kind !== "plant"));
  for (const room of model.viewpoints) {
    const spawn = walkthroughSpawn(model, room.id);
    assert.equal(canWalkTo(layout, spawn.position), true, room.id);
    assert.ok(Number.isFinite(spawn.target.x) && Number.isFinite(spawn.target.z));
  }
  near(walkthroughSpawn(model).position, world(464, 740));
});

test("the actual bedroom doorway can be walked through in both directions", () => {
  const living = world(430, 760);
  const bedroom = world(315, 760);
  assert.equal(canWalkTo(layout, living), true);
  assert.equal(canWalkTo(layout, bedroom), true);
  const entered = moveWalkthrough(layout, living, displacement(living, bedroom));
  near(entered, bedroom);
  const returned = moveWalkthrough(layout, entered, displacement(entered, living));
  near(returned, living);
});

test("the bedroom partition blocks walking and a large frame displacement cannot tunnel through it", () => {
  const start = world(300, 380);
  const wall = world(300, 429);
  assert.equal(canWalkTo(layout, start), true);
  assert.equal(canWalkTo(layout, wall), false);
  for (const distance of [1, 1000]) {
    const stopped = moveWalkthrough(layout, start, { x: 0, z: distance });
    assert.equal(canWalkTo(layout, stopped), true);
    assert.ok(stopped.z > start.z, "The person approaches the wall");
    assert.ok(stopped.z <= wall.z - 0.16 - 0.115 / 2 + 1e-8);
  }
});

test("diagonal movement slides along a wall without entering it", () => {
  const start = world(300, 380);
  const desired = world(220, 490);
  const stopped = moveWalkthrough(layout, start, displacement(start, desired));
  assert.equal(canWalkTo(layout, stopped), true);
  assert.ok(Math.abs(stopped.x - desired.x) < 1e-8, "Horizontal movement continues along the partition");
  assert.ok(stopped.z < world(220, 429).z - 0.16, "Forward movement stops at the partition");
});

test("sofa and bed footprints block the camera while decorative plants do not become obstacles", () => {
  assert.equal(canWalkTo(layout, world(620, 540)), false);
  assert.equal(canWalkTo(layout, world(200, 560)), false);
  assert.equal(layout.obstacles.some((item) => item.kind === "plant"), false);
  assert.equal(layout.obstacles.some((item) => item.kind === "sofa"), true);
  assert.equal(layout.obstacles.some((item) => item.kind === "bed"), true);
});

test("the camera stays inside the balcony even where there is no rendered front wall", () => {
  const start = world(460, 885);
  assert.equal(canWalkTo(layout, start), true);
  const stopped = moveWalkthrough(layout, start, { x: 0, z: 1000 });
  assert.equal(canWalkTo(layout, stopped), true);
  assert.ok(stopped.z <= world(460, 928).z - 0.16 + 1e-8);
  assert.equal(canWalkTo(layout, world(460, 950)), false);
});

test("the L-shaped apartment's empty corner is outside the walkable footprint", () => {
  const large = getParnavazApartmentModel(117);
  const largeLayout = createWalkthroughLayout(large);
  assert.equal(canWalkTo(largeLayout, calibratedWorld(650, 600, large, largeLayout)), false);
  const start = calibratedWorld(399, 579, large, largeLayout);
  const end = moveWalkthrough(largeLayout, start, { x: 20, z: 0 });
  assert.equal(canWalkTo(largeLayout, end), true);
  assert.ok(end.x < calibratedWorld(464, 579, large, largeLayout).x);
});

test("a blocked room viewpoint gets a clear fallback spawn without changing the source model", () => {
  const blocked = {
    ...model,
    viewpoints: model.viewpoints.map((room) => room.id === "living"
      ? { ...room, position: [(200 - 20) / 702, (560 - 90) / 860] }
      : room),
  };
  const before = JSON.stringify(blocked);
  const spawned = walkthroughSpawn(blocked, "living");
  assert.equal(canWalkTo(createWalkthroughLayout(blocked), spawned.position), true);
  assert.notDeepEqual(spawned.position, world(200, 560));
  assert.equal(JSON.stringify(blocked), before);
});

test("movement preserves a caller's displacement and rejects invalid numeric input", () => {
  const start = world(464, 740);
  near(moveWalkthrough(layout, start, { x: 0.1, z: -0.1 }), {
    x: start.x + 0.1,
    z: start.z - 0.1,
  });
  near(moveWalkthrough(layout, start, { x: 0, z: 0 }), start);
  near(moveWalkthrough(layout, start, { x: Number.NaN, z: 0 }), start);
  near(moveWalkthrough(layout, start, { x: Infinity, z: 0 }), start);
  assert.equal(canWalkTo(layout, { x: Number.NaN, z: 0 }), false);
  assert.equal(canWalkTo(layout, start, -1), false);
});

test("the 117 m² living room matches its board: hall door, closed corner and solid glass", () => {
  const large = getParnavazApartmentModel(117);
  const largeLayout = createWalkthroughLayout(large);
  const at = (x, y) => calibratedWorld(x, y, large, largeLayout);
  // The hall opens into the living room through its door beside the column.
  const hall = at(421, 430);
  const living = at(421, 540);
  assert.equal(canWalkTo(largeLayout, hall), true);
  near(moveWalkthrough(largeLayout, hall, displacement(hall, living)), living);
  // Behind the sofa the wall now runs from the corner column, with no gap
  // through to bedroom 2.
  const corner = at(125, 466);
  const covered = largeLayout.walls.some(({ start, end }) => {
    const dx = end.x - start.x;
    const dz = end.z - start.z;
    const t = Math.max(0, Math.min(1, ((corner.x - start.x) * dx + (corner.z - start.z) * dz) / (dx * dx + dz * dz)));
    return Math.hypot(corner.x - start.x - t * dx, corner.z - start.z - t * dz) < 0.01;
  });
  assert.ok(covered, "a wall covers the corner behind the sofa");
  const column = at(130, 463);
  assert.ok(largeLayout.obstacles.some((item) => item.kind === "column"
    && column.x > item.minX && column.x < item.maxX && column.z > item.minZ && column.z < item.maxZ));
  // Fixed glazing to the balcony is solid; the balcony door beside it is not.
  const byGlass = at(160, 690);
  const throughGlass = moveWalkthrough(largeLayout, byGlass, displacement(byGlass, at(90, 690)));
  assert.ok(throughGlass.x > at(128, 690).x);
  // The L-sofa stands in front of that door, so reach it along the gap behind.
  const behindSofa = at(141, 540);
  const byDoor = moveWalkthrough(largeLayout, behindSofa, displacement(behindSofa, at(141, 597)));
  near(byDoor, at(141, 597));
  const throughDoor = moveWalkthrough(largeLayout, byDoor, displacement(byDoor, at(90, 597)));
  assert.ok(throughDoor.x < at(128, 597).x);
});

test("no traced piece stands inside a wall or column, except a TV unit built around one", () => {
  for (const current of PARNAVAZ_APARTMENT_MODELS) {
    // The 46.5 m² interior is hand-built and places its own furniture.
    if (current.area === 46.5) continue;
    const { width, depth } = current.size;
    const metres = ([x, z, w, d]) => [x * width, z * depth, (x + w) * width, (z + d) * depth];
    const onOutline = ([px, pz]) => current.footprint.some((corner, index) => {
      const next = current.footprint[(index + 1) % current.footprint.length];
      const [ax, az, bx, bz] = [corner[0] * width, corner[1] * depth, next[0] * width, next[1] * depth];
      const length = Math.hypot(bx - ax, bz - az) || 1;
      const t = Math.max(0, Math.min(1, ((px * width - ax) * (bx - ax) + (pz * depth - az) * (bz - az)) / (length * length)));
      return Math.hypot(px * width - ax - t * (bx - ax), pz * depth - az - t * (bz - az)) < 0.05;
    });
    const solids = [
      ...current.walls.map(([from, to]) => {
        const half = onOutline(from) && onOutline(to) ? 0.11 : 0.06;
        const [ax, az, bx, bz] = [from[0] * width, from[1] * depth, to[0] * width, to[1] * depth];
        const vertical = Math.abs(ax - bx) < Math.abs(az - bz);
        return { kind: "wall", box: [
          Math.min(ax, bx) - (vertical ? half : 0), Math.min(az, bz) - (vertical ? 0 : half),
          Math.max(ax, bx) + (vertical ? half : 0), Math.max(az, bz) + (vertical ? 0 : half),
        ] };
      }),
      ...(current.columns ?? []).map((column) => ({ kind: "column", box: metres(column) })),
    ];
    for (const piece of current.furniture) {
      if (piece.kind === "rug") continue;
      const [l, t, r, b] = metres(piece.rect);
      for (const { kind, box: [sl, st, sr, sb] } of solids) {
        const overlap = Math.min(Math.min(r, sr) - Math.max(l, sl), Math.min(b, sb) - Math.max(t, st));
        if (overlap <= 0.02 || (kind === "column" && piece.kind === "media")) continue;
        assert.fail(`${current.id}: ${piece.kind} at ${piece.rect.map((v) => v.toFixed(3))} is ${overlap.toFixed(2)} m inside a ${kind}`);
      }
    }
  }
});

test("bedside tables sit beside their bed, not under it", () => {
  for (const current of PARNAVAZ_APARTMENT_MODELS) {
    if (current.area === 46.5) continue;
    const { width, depth } = current.size;
    const metres = ([x, z, w, d]) => [x * width, z * depth, (x + w) * width, (z + d) * depth];
    const beds = current.furniture.filter(({ kind }) => kind === "bed").map(({ rect }) => metres(rect));
    for (const piece of current.furniture.filter(({ kind }) => kind === "nightstand" || kind === "sideTable")) {
      const [l, t, r, b] = metres(piece.rect);
      for (const [bl, bt, br, bb] of beds) {
        const overlap = Math.min(Math.min(r, br) - Math.max(l, bl), Math.min(b, bb) - Math.max(t, bt));
        assert.ok(overlap <= 0.02, `${current.id}: ${piece.kind} overlaps a bed by ${overlap.toFixed(2)} m`);
      }
    }
  }
});

test("every apartment can be entered at its bathroom", () => {
  for (const current of PARNAVAZ_APARTMENT_MODELS) {
    assert.ok(current.viewpoints.some(({ id }) => id === "bathroom"), `${current.id} has a bathroom viewpoint`);
    const spawn = walkthroughSpawn(current, "bathroom");
    assert.equal(canWalkTo(createWalkthroughLayout(current), spawn.position), true, `${current.id} bathroom spawn is clear`);
  }
});
