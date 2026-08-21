import assert from "node:assert/strict";

const auditOrigin = process.env.SEO_BASE_URL ?? "http://localhost:3000";
const canonicalOrigin = "https://www.comfortbuilding.ge";
const languages = ["ka", "en", "ru"];

function auditUrl(path) {
  return new URL(path, auditOrigin);
}

async function get(path, redirect = "manual") {
  return fetch(auditUrl(path), { redirect });
}

function canonicalFrom(html) {
  return html.match(/<link rel="canonical" href="([^"]+)"\s*\/?>/i)?.[1];
}

const sitemapResponse = await get("/sitemap.xml");
assert.equal(sitemapResponse.status, 200, "sitemap.xml must return 200");

const sitemap = await sitemapResponse.text();
const canonicalUrls = Array.from(
  sitemap.matchAll(/<url>\s*<loc>([^<]+)<\/loc>/g),
  (match) => match[1],
);

assert.equal(canonicalUrls.length, 36, "sitemap must contain 36 page URLs");
assert.equal(
  new Set(canonicalUrls).size,
  canonicalUrls.length,
  "sitemap page URLs must be unique",
);

const projectPathsByLanguage = Object.fromEntries(
  languages.map((language) => [
    language,
    canonicalUrls
      .map((url) => new URL(url).pathname)
      .filter((path) => path.startsWith(`/${language}/projects/`)),
  ]),
);

const pageAudits = await Promise.all(
  canonicalUrls.map(async (canonicalUrl) => {
    const canonical = new URL(canonicalUrl);
    assert.equal(
      canonical.origin,
      canonicalOrigin,
      `${canonicalUrl} must use the canonical origin`,
    );

    const response = await get(canonical.pathname);
    assert.equal(response.status, 200, `${canonical.pathname} must return 200`);

    const html = await response.text();
    assert.ok(
      !html.includes("data-preloading"),
      `${canonical.pathname} must not block search visitors behind a preloader`,
    );
    assert.equal(
      canonicalFrom(html),
      canonicalUrl,
      `${canonical.pathname} must have a self-referencing canonical`,
    );
    assert.match(html, /<meta name="robots" content="index, follow"\s*\/?>/i);
    const title = html.match(/<title>([^<]+)<\/title>/i)?.[1];
    const description = html.match(
      /<meta name="description" content="([^"]+)"\s*\/?>/i,
    )?.[1];
    assert.ok(title, `${canonical.pathname} must have a title`);
    assert.ok(description, `${canonical.pathname} must have a description`);
    assert.match(html, /<h1(?:\s[^>]*)?>/i);

    const jsonLdBlocks = Array.from(
      html.matchAll(
        /<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi,
      ),
      (match) => match[1],
    );
    assert.ok(
      jsonLdBlocks.length > 0,
      `${canonical.pathname} must include JSON-LD`,
    );
    for (const jsonLd of jsonLdBlocks) JSON.parse(jsonLd);

    const language = canonical.pathname.split("/")[1];
    const normalizedHtml = html.toLowerCase();
    for (const alternate of [...languages, "x-default"]) {
      assert.ok(
        normalizedHtml.includes(`hreflang="${alternate}"`),
        `${canonical.pathname} must link to the ${alternate} alternate`,
      );
    }

    for (const projectPath of projectPathsByLanguage[language]) {
      assert.ok(
        html.includes(`href="${projectPath}"`),
        `${canonical.pathname} must link directly to ${projectPath}`,
      );
    }

    assert.ok(
      html.includes(`href="/${language}/apartments"`),
      `${canonical.pathname} must link directly to the apartments page`,
    );
    assert.ok(
      html.includes(`href="/${language}/buying-guide"`),
      `${canonical.pathname} must link directly to the buyer guide`,
    );
    assert.ok(
      html.includes('data-contact-action="mobile-dock-call"'),
      `${canonical.pathname} must expose the mobile call action`,
    );

    return { canonicalUrl, title, description };
  }),
);

assert.equal(
  new Set(pageAudits.map((page) => page.title)).size,
  pageAudits.length,
  "every canonical page must have a unique title",
);
assert.equal(
  new Set(pageAudits.map((page) => page.description)).size,
  pageAudits.length,
  "every canonical page must have a unique description",
);

for (const [language, heading] of [
  ["ka", "გასაყიდი ბინები ბათუმში"],
  ["ru", "Квартиры в Батуми от застройщика"],
]) {
  const response = await get(`/${language}/apartments`);
  const html = await response.text();
  assert.ok(html.includes(heading), `/${language}/apartments must target ${heading}`);
  assert.equal(
    html.match(/"@type":"Offer"/g)?.length,
    11,
    `/${language}/apartments must publish 11 visible offers`,
  );
  assert.equal(
    html.match(/id="apartment-[^"]+"/g)?.length,
    11,
    `/${language}/apartments must render 11 apartment cards`,
  );
  assert.equal(
    html.match(/data-contact-action="apartment-inquiry"/g)?.length,
    11,
    `/${language}/apartments must expose an inquiry action for every apartment`,
  );
}

for (const [language, heading] of [
  ["ka", "როგორ ვიყიდოთ ბინა ბათუმში"],
  ["en", "How to buy an apartment in Batumi"],
  ["ru", "Как купить квартиру в Батуми"],
]) {
  const response = await get(`/${language}/buying-guide`);
  const html = await response.text();
  assert.ok(
    html.includes(heading),
    `/${language}/buying-guide must target ${heading}`,
  );
  assert.ok(
    html.includes("napr.gov.ge"),
    `/${language}/buying-guide must link to the official Public Registry`,
  );
  assert.ok(
    html.includes('"@type":"Article"'),
    `/${language}/buying-guide must include Article structured data`,
  );
}

for (const language of languages) {
  const response = await get(`/${language}/contact`);
  const html = await response.text();
  assert.ok(
    html.includes("data-lead-inquiry"),
    `/${language}/contact must render the guided inquiry form`,
  );
  assert.equal(
    html.match(/<option value="apartment-[^"]+"/g)?.length,
    11,
    `/${language}/contact must offer all 11 available apartments`,
  );
  assert.ok(
    html.includes('"@type":"ContactPoint"'),
    `/${language}/contact must publish sales contact structured data`,
  );
}

for (const language of languages) {
  const response = await get(`/${language}`);
  const html = await response.text();
  assert.equal(
    html.match(/data-home-apartment="[^"]+"/g)?.length,
    3,
    `/${language} must feature three available apartments on the homepage`,
  );
  for (const number of ["802", "905", "703"]) {
    assert.ok(
      html.includes(
        `href="/${language}/apartments#apartment-${number}"`,
      ),
      `/${language} must link apartment ${number} to its sales-page entry`,
    );
  }
}

const redirects = [
  ["/", "/ka"],
  ["/en/project/Comfort-house", "/en/projects/comfort-house"],
  ["/project/saxli-farnavazze-", "/ka/projects/house-on-parnavaz"],
  ["/project/saxli-piacastan-", "/ka/projects/house-near-piazza"],
  ["/public/ru/projects/future", "/ru/projects"],
  ["/public/en/company", "/en/about"],
];

for (const [source, destination] of redirects) {
  const response = await get(source);
  assert.equal(response.status, 308, `${source} must permanently redirect`);
  assert.equal(
    response.headers.get("location"),
    destination,
    `${source} must redirect to ${destination}`,
  );
}

for (const path of ["/en/project/not-a-project", "/en/news/novosti"]) {
  const response = await get(path);
  assert.equal(response.status, 404, `${path} must return a real 404`);
  assert.match(
    await response.text(),
    /<meta name="robots" content="noindex"\s*\/?>/i,
    `${path} must be noindex`,
  );
}

console.log(
  `SEO check passed: ${canonicalUrls.length} canonical pages, ${redirects.length} redirects, and 2 noindex 404s.`,
);
