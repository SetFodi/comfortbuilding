import assert from "node:assert/strict";

const auditOrigin = process.env.SEO_BASE_URL ?? "http://localhost:3000";
const canonicalOrigin = "https://www.comfortbuilding.ge";
const organizationId = `${canonicalOrigin}/#organization`;
const websiteId = `${canonicalOrigin}/#website`;

async function get(path) {
  const response = await fetch(new URL(path, auditOrigin), {
    redirect: "manual",
    signal: AbortSignal.timeout(30_000),
  });
  assert.equal(response.status, 200, `${path} must return 200`);
  return response.text();
}

function decodeEntities(text) {
  const named = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " ",
  };
  return text.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (entity, code) => {
    if (code[0] !== "#") return named[code.toLowerCase()] ?? entity;
    const hex = code[1].toLowerCase() === "x";
    const value = Number.parseInt(code.slice(hex ? 2 : 1), hex ? 16 : 10);
    return value >= 0 && value <= 0x10ffff ? String.fromCodePoint(value) : entity;
  });
}

function readableText(html) {
  // Preserve literal text spacing. Inserting spaces for every span would hide
  // the animated-heading regression that this check is intended to catch.
  return decodeEntities(html.replace(/<[^>]+>/g, ""))
    .replace(/\s+/g, " ")
    .trim();
}

function jsonLdDefinitions(html, path) {
  const definitions = [];
  const visit = (value) => {
    if (Array.isArray(value)) {
      value.forEach(visit);
    } else if (value && typeof value === "object") {
      if (typeof value["@id"] === "string" && value["@type"]) {
        definitions.push(value);
      }
      Object.values(value).forEach(visit);
    }
  };

  for (const script of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (!/\btype\s*=\s*["']application\/ld\+json["']/i.test(script[1])) continue;
    let data;
    try {
      data = JSON.parse(script[2]);
    } catch (error) {
      throw new Error(`${path} has invalid JSON-LD: ${error.message}`);
    }
    visit(data);
  }
  assert.ok(definitions.length > 0, `${path} must expose JSON-LD definitions in its raw HTML`);
  return definitions;
}

function oneDefinition(definitions, id, path) {
  const matches = definitions.filter((node) => node["@id"] === id);
  assert.equal(matches.length, 1, `${path} must define ${id} exactly once`);
  return matches[0];
}

function hasType(node, expected) {
  return Array.isArray(node["@type"])
    ? node["@type"].includes(expected)
    : node["@type"] === expected;
}

const sitemap = await get("/sitemap.xml");
const canonicalUrls = Array.from(
  sitemap.matchAll(/<url>\s*<loc>([^<]+)<\/loc>/g),
  (match) => decodeEntities(match[1]),
);
assert.ok(canonicalUrls.length > 0, "The sitemap must expose canonical pages");
assert.equal(new Set(canonicalUrls).size, canonicalUrls.length, "Sitemap page URLs must be unique");

const pages = [];
// Fetch a small batch at a time so a local dev server can compile routes
// without every localized page competing for resources simultaneously.
for (let index = 0; index < canonicalUrls.length; index += 4) {
  const batch = canonicalUrls.slice(index, index + 4);
  pages.push(...await Promise.all(batch.map(async (canonicalUrl) => {
    const canonical = new URL(canonicalUrl);
    assert.equal(canonical.origin, canonicalOrigin, `${canonicalUrl} must use the canonical origin`);
    return { canonicalUrl, path: canonical.pathname, html: await get(canonical.pathname) };
  })));
}

const failures = [];
let projectPages = 0;
for (const { canonicalUrl, path, html } of pages) {
  const check = (description, run) => {
    try {
      run();
    } catch (error) {
      failures.push(`${description}: ${error.message}`);
    }
  };

  check(`${path} heading`, () => {
    const headings = Array.from(html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi));
    assert.equal(headings.length, 1, `${path} must have exactly one H1`);
    const heading = readableText(headings[0][1]);
    assert.ok(heading, `${path} H1 must have readable text`);
    if (path === "/ka") {
      assert.ok(
        heading.includes("სამშენებლო კომპანია ბათუმში"),
        `The Georgian homepage H1 must contain the readable phrase სამშენებლო კომპანია ბათუმში; got ${JSON.stringify(heading)}`,
      );
    }
  });

  check(`${path} structured data`, () => {
    const definitions = jsonLdDefinitions(html, path);
    const organization = oneDefinition(definitions, organizationId, path);
    if (/^\/(ka|en|ru)$/.test(path)) {
      const title = readableText(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "");
      assert.equal(title.split(organization.name).length - 1, 1, `${path} title must include the company name exactly once`);
    }
    const website = oneDefinition(definitions, websiteId, path);
    assert.ok(hasType(website, "WebSite"), `${path} must identify the website as a WebSite`);
    assert.equal(website.publisher?.["@id"], organizationId, `${path} website publisher must resolve to the company`);
  });

  if (/^\/(ka|en|ru)\/projects\/[^/]+$/.test(path)) {
    projectPages += 1;
    check(`${path} project entity`, () => {
      const definitions = jsonLdDefinitions(html, path);
      const page = oneDefinition(definitions, `${canonicalUrl}#webpage`, path);
      const project = oneDefinition(definitions, `${canonicalUrl}#project`, path);
      assert.ok(hasType(project, "ApartmentComplex"), `${path} must identify its project as an ApartmentComplex`);
      const mainEntities = Array.isArray(page.mainEntity) ? page.mainEntity : [page.mainEntity];
      assert.ok(
        mainEntities.some((entity) => entity?.["@id"] === project["@id"]),
        `${path} webpage mainEntity must resolve to its declared project entity`,
      );
      assert.equal(project.mainEntityOfPage?.["@id"], page["@id"], `${path} project must link back to its webpage`);
    });
  }
}

assert.ok(pages.some((page) => page.path === "/ka"), "The sitemap must include the Georgian homepage");
assert.ok(pages.some((page) => /^\/(ka|en|ru)\/projects\/[^/]+$/.test(page.path)), "The sitemap must include project pages");
if (failures.length > 0) {
  console.error(`Search content check failed (${failures.length} checks):\n${failures.map((failure) => `- ${failure}`).join("\n")}`);
  process.exitCode = 1;
} else {
  console.log(`Search content check passed: readable single headings and linked company/website entities on ${pages.length} pages, with ${projectPages} project entity links.`);
}
