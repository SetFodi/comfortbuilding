import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { runInThisContext } from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL("../", import.meta.url));
const modules = new Map();

// Load the real project catalogue and its TypeScript dependencies; no fixture
// copies of availability or apartment numbering can silently drift from sales.
function loadSource(relativePath) {
  const filename = resolve(root, relativePath);
  if (modules.has(filename)) return modules.get(filename).exports;
  const loadedModule = { exports: {} };
  modules.set(filename, loadedModule);
  const source = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
    fileName: filename,
  }).outputText;
  const loadDependency = (specifier) => {
    if (specifier.startsWith(".") || specifier.startsWith("@/")) {
      const path = specifier.startsWith("@/")
        ? resolve(root, "src", specifier.slice(2))
        : resolve(dirname(filename), specifier);
      return loadSource(path.endsWith(".ts") ? path : `${path}.ts`);
    }
    return require(specifier);
  };
  runInThisContext(`(function(module, exports, require) {\n${source}\n})`, {
    filename,
  })(loadedModule, loadedModule.exports, loadDependency);
  return loadedModule.exports;
}

const { PROJECTS } = loadSource("src/lib/projects.ts");
const { inquiryApartments } = loadSource("src/lib/inquiry-context.ts");
const { parseInquiry } = loadSource("src/lib/inquiry-validation.ts");
const {
  PARNAVAZ_FACADE,
  PARNAVAZ_FACADE_FLOORS,
  parnavazFloorState,
} = loadSource("src/lib/parnavaz-facade.ts");
const {
  PARNAVAZ_APARTMENT_MODELS,
  getParnavazApartmentModel,
} = loadSource("src/lib/parnavaz-apartment-models.ts");
const parnavaz = PROJECTS.find((project) => project.slug === "parnavaz-65");
assert.ok(parnavaz?.priceList, "Parnavaz 65 has its published sales inventory");

const inquiryProjects = PROJECTS.map((project) => ({
  slug: project.slug,
  name: project.name.en,
  apartments: inquiryApartments(project),
}));
const baseInquiry = {
  name: "Explorer test",
  contact: "test@example.com",
  message: "I would like to view this apartment.",
  lang: "en",
  projectSlug: "parnavaz-65",
  topic: "apartment",
  unitId: "701",
  website: "",
  requestId: "07ae9c32-3cac-4a10-99bd-640a52b0d41f",
};

test("all 20 published Parnavaz apartments can reach the inquiry form with their project and number", () => {
  const apartments = inquiryApartments(parnavaz);
  assert.equal(apartments.length, 20);
  assert.equal(new Set(apartments.map((unit) => unit.id)).size, 20);
  assert.deepEqual(
    apartments.map((unit) => unit.number).sort(),
    parnavaz.priceList.units.map((unit) => unit.number).sort(),
  );
  for (const apartment of apartments) {
    const result = parseInquiry(
      { ...baseInquiry, unitId: apartment.id },
      inquiryProjects,
    );
    assert.equal(result.ok, true, `Parnavaz apartment ${apartment.number}`);
    assert.equal(result.inquiry.projectSlug, "parnavaz-65");
    assert.equal(result.inquiry.projectName, "Parnavaz Mepe St. №65");
    assert.equal(result.inquiry.apartmentNumber, apartment.number);
  }
});

test("sold apartment 701 is rejected for both Parnavaz and Comfort House", () => {
  for (const projectSlug of ["parnavaz-65", "comfort-house"]) {
    const result = parseInquiry({ ...baseInquiry, projectSlug }, inquiryProjects);
    assert.equal(result.ok, false, `${projectSlug} apartment 701 is sold`);
    assert.equal(result.error, "apartment");
  }
  assert.equal(
    parseInquiry(
      { ...baseInquiry, projectSlug: "comfort-house", unitId: "301" },
      inquiryProjects,
    ).ok,
    false,
  );
});

test("unlisted, sold, floor-eight, and missing Parnavaz apartment choices are rejected", () => {
  for (const unitId of ["", "302", "801", "999", "sold-unit"]) {
    const result = parseInquiry(
      { ...baseInquiry, unitId },
      inquiryProjects,
    );
    assert.equal(result.ok, false, `Unexpectedly accepted apartment ${unitId}`);
    assert.equal(result.error, "apartment");
  }
});

test("floor selection distinguishes sold floors and the excluded eighth floor from available apartments", () => {
  const expectedCounts = [0, 0, 2, 1, 5, 7, 5, 0];
  for (let floor = 1; floor <= 8; floor += 1) {
    const count = parnavaz.priceList.units.filter((unit) => unit.floor === floor).length;
    assert.equal(count, expectedCounts[floor - 1], `Availability on floor ${floor}`);
    assert.equal(
      parnavazFloorState(parnavaz.priceList, floor),
      floor === 8 ? "not-for-sale" : floor <= 2 ? "sold" : "available",
      `Selection state on floor ${floor}`,
    );
  }
});

test("each facade level and its number marker fit the actual uncropped building image", async () => {
  const sharp = require("sharp");
  const image = await sharp(resolve(root, "public/images/projects/parnavaz-65/render.jpg")).metadata();
  assert.equal(PARNAVAZ_FACADE.width, image.width);
  assert.equal(PARNAVAZ_FACADE.height, image.height);
  assert.deepEqual(
    PARNAVAZ_FACADE_FLOORS.map((floor) => floor.number).sort((a, b) => a - b),
    [1, 2, 3, 4, 5, 6, 7, 8],
  );
  for (const floor of PARNAVAZ_FACADE_FLOORS) {
    const points = floor.points.trim().split(/\s+/).map((point) => point.split(",").map(Number));
    assert.ok(points.length >= 3, `Floor ${floor.number} forms a polygon`);
    for (const [x, y] of [...points, floor.marker]) {
      assert.ok(Number.isFinite(x) && x >= 0 && x <= image.width, `Floor ${floor.number} x-coordinate ${x}`);
      assert.ok(Number.isFinite(y) && y >= 0 && y <= image.height, `Floor ${floor.number} y-coordinate ${y}`);
    }
  }
});

test("3D models match the seven supplied layouts, and close sizes borrow the nearest design", () => {
  assert.equal(PARNAVAZ_APARTMENT_MODELS.length, 7);
  assert.equal(new Set(PARNAVAZ_APARTMENT_MODELS.map((model) => model.id)).size, 7);
  assert.deepEqual(
    PARNAVAZ_APARTMENT_MODELS.map((model) => model.area).sort((a, b) => a - b),
    parnavaz.layouts.map((layout) => layout.totalArea).sort((a, b) => a - b),
  );
  for (const layout of parnavaz.layouts) {
    const model = getParnavazApartmentModel(layout.totalArea);
    assert.ok(model, `The supplied ${layout.totalArea} m² layout has a model`);
    assert.equal(model.area, layout.totalArea);
    assert.equal(model.bedrooms, layout.bedrooms);
    assert.equal(model.source.src, layout.image.src);
  }
  // Apartments within 2.5 m² of a designed type use that type's design.
  for (const [area, design] of [[46.3, 46.5], [54, 55.1], [43.4, 45.7]]) {
    assert.equal(getParnavazApartmentModel(area)?.area, design, `${area} m² is shown with the ${design} m² design`);
  }
  // Nothing designed is close to 97.4 m², so it has no model.
  assert.equal(getParnavazApartmentModel(97.4), undefined);
  for (const unit of parnavaz.priceList.units) {
    const model = getParnavazApartmentModel(unit.totalArea);
    if (model) assert.ok(Math.abs(model.area - unit.totalArea) <= 2.5, `Apartment ${unit.number} design is close in size`);
  }
});

function isInsideFootprint([x, y], footprint) {
  let inside = false;
  for (let index = 0, previous = footprint.length - 1; index < footprint.length; previous = index, index += 1) {
    const [ax, ay] = footprint[previous];
    const [bx, by] = footprint[index];
    const cross = (x - ax) * (by - ay) - (y - ay) * (bx - ax);
    if (
      Math.abs(cross) < 1e-10
      && x >= Math.min(ax, bx) - 1e-10 && x <= Math.max(ax, bx) + 1e-10
      && y >= Math.min(ay, by) - 1e-10 && y <= Math.max(ay, by) + 1e-10
    ) return true;
    if ((ay > y) !== (by > y) && x < ((bx - ax) * (y - ay)) / (by - ay) + ax) inside = !inside;
  }
  return inside;
}

test("plan crops use real image bounds and all interior camera views remain within their apartment footprint", async () => {
  const sharp = require("sharp");
  for (const model of PARNAVAZ_APARTMENT_MODELS) {
    const image = await sharp(resolve(root, "public", model.source.src.slice(1))).metadata();
    assert.equal(model.source.width, image.width, `${model.id} source width`);
    assert.equal(model.source.height, image.height, `${model.id} source height`);
    const [left, top, width, height] = model.source.crop;
    assert.ok(left >= 0 && top >= 0 && width > 0 && height > 0, `${model.id} positive crop`);
    assert.ok(left + width <= image.width && top + height <= image.height, `${model.id} crop fits image`);
    assert.ok(model.footprint.length >= 3, `${model.id} has a footprint`);
    for (const [x, y] of model.footprint) {
      assert.ok(x >= 0 && x <= 1 && y >= 0 && y <= 1, `${model.id} normalized footprint`);
    }
    assert.ok(model.viewpoints.some((viewpoint) => viewpoint.id === "living"), `${model.id} living-room entry view`);
    assert.ok(model.viewpoints.some((viewpoint) => viewpoint.id === "bedroom"), `${model.id} bedroom view`);
    for (const viewpoint of model.viewpoints) {
      assert.ok(
        isInsideFootprint(viewpoint.position, model.footprint),
        `${model.id} ${viewpoint.id} camera remains inside the apartment`,
      );
      assert.ok(
        isInsideFootprint(viewpoint.target, model.footprint),
        `${model.id} ${viewpoint.id} camera looks into the apartment`,
      );
    }
  }
});
