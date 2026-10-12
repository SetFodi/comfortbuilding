import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const require = createRequire(import.meta.url);
const { ImageConfigContext } = require("next/dist/shared/lib/image-config-context.shared-runtime");
const { imageConfigDefault } = require("next/dist/shared/lib/image-config");
const filename = new URL("../src/components/hero-project-carousel.tsx", import.meta.url);
const compiled = ts.transpileModule(readFileSync(filename, "utf8"), {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    jsx: ts.JsxEmit.ReactJSX,
    esModuleInterop: true,
  },
}).outputText;
const componentModule = { exports: {} };
runInNewContext(compiled, {
  module: componentModule,
  exports: componentModule.exports,
  require,
  process,
  console,
});
const { HeroProjectCarousel } = componentModule.exports;

const projects = [
  { slug: "comfort-house", name: "Comfort House", image: { src: "/images/experimental-ai/comfort-house-golden-hour.png", alt: "Comfort House" } },
  { slug: "house-near-piazza", name: "House near Piazza", image: { src: "/images/experimental-ai/house-near-piazza-enhanced.png", alt: "House near Piazza" } },
  { slug: "house-on-parnavaz", name: "House on Parnavaz Mepe", image: { src: "/images/experimental-ai/house-on-parnavaz-listing.png", alt: "House on Parnavaz Mepe" } },
].map((project) => ({
  ...project,
  href: `/en/projects/${project.slug}`,
  city: "Batumi",
  address: "",
  status: "Completed",
  floors: "",
}));

test("initial server HTML loads only the first carousel image while retaining every project link and name", () => {
  const html = renderToStaticMarkup(React.createElement(
    ImageConfigContext.Provider,
    { value: { ...imageConfigDefault, qualities: [75, 90] } },
    React.createElement(HeroProjectCarousel, {
      projects,
      labels: { projects: "Projects", previous: "Previous", next: "Next" },
    }),
  ));

  assert.equal((html.match(/<img\b/g) ?? []).length, 1);
  assert.ok(html.includes("comfort-house-golden-hour.png"));
  assert.ok(!html.includes("house-near-piazza-enhanced.png"));
  assert.ok(!html.includes("house-on-parnavaz-listing.png"));
  assert.ok(html.includes('href="/en/projects/comfort-house"'));
  assert.ok(html.includes('href="/en/projects/house-near-piazza"'));
  assert.ok(html.includes('href="/en/projects/house-on-parnavaz"'));
  assert.ok(html.includes("Comfort House"));
  assert.ok(html.includes("House near Piazza"));
  assert.ok(html.includes("House on Parnavaz Mepe"));
  assert.ok(html.includes("q=90"), "the photograph retains quality90");
});
