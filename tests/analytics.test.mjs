import assert from "node:assert/strict";
import { after, test } from "node:test";
import {
  ANALYTICS_CONSENT_KEY,
  configureAnalytics,
  GA_MEASUREMENT_ID,
  trackContactEvent,
} from "../src/lib/analytics.ts";
import { inquiryHref, projectFromLocation } from "../src/lib/inquiry-context.ts";

function browser() {
  const values = new Map();
  globalThis.window = { location: new URL("https://www.comfortbuilding.ge/en/contact?project=comfort-house&email=private@example.com") };
  globalThis.document = { referrer: "https://www.comfortbuilding.ge/en?email=private@example.com" };
  globalThis.localStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
  configureAnalytics("denied");
  return values;
}

after(() => {
  delete globalThis.window;
  delete globalThis.localStorage;
  delete globalThis.document;
});

test("no analytics commands are sent before permission", () => {
  browser();
  trackContactEvent("phone_click", { project: "comfort-house", language: "en", placement: "header" });
  assert.equal(window.dataLayer, undefined);
  assert.equal(window[`ga-disable-${GA_MEASUREMENT_ID}`], true);
});

test("events carry project context and omit private fields and URL queries", () => {
  const values = browser();
  values.set(ANALYTICS_CONSENT_KEY, "granted");
  configureAnalytics("granted");
  trackContactEvent("generate_lead", {
    project: "comfort-house", language: "en", placement: "inquiry-form", apartment: "701",
    name: "Private name", contact: "private@example.com", message: "Private message",
  });
  const command = Array.from(window.dataLayer.at(-1));
  assert.equal(command[0], "event");
  assert.equal(command[1], "generate_lead");
  assert.equal(command[2].project_slug, "comfort-house");
  assert.equal(command[2].site_language, "en");
  assert.equal(command[2].apartment_number, "701");
  assert.equal(command[2].page_location, "https://www.comfortbuilding.ge/en/contact");
  assert.equal(command[2].page_referrer, "https://www.comfortbuilding.ge");
  assert.equal(command[2].lead_source, "website_form");
  assert.ok(!JSON.stringify(command).includes("Private"));
  assert.ok(!JSON.stringify(command).includes("private@example.com"));
  assert.equal(Array.isArray(window.dataLayer.at(-1)), false, "Google tag needs its native arguments command format");
});

test("opting out stops events and disables the loaded Google tag", () => {
  const values = browser();
  values.set(ANALYTICS_CONSENT_KEY, "granted");
  configureAnalytics("granted");
  values.set(ANALYTICS_CONSENT_KEY, "denied");
  configureAnalytics("denied");
  const before = window.dataLayer.length;
  trackContactEvent("phone_click", { project: "comfort-house", language: "en", placement: "header" });
  assert.equal(window.dataLayer.length, before);
  assert.equal(window[`ga-disable-${GA_MEASUREMENT_ID}`], true);
});

test("explicit consent still works when local storage is blocked", () => {
  browser();
  globalThis.localStorage.getItem = () => { throw new Error("storage blocked"); };
  configureAnalytics("granted");
  trackContactEvent("phone_click", { project: "comfort-house", language: "en", placement: "header" });
  assert.equal(Array.from(window.dataLayer.at(-1))[1], "phone_click");
});

test("project attribution survives inquiry navigation without inventing a project", () => {
  const href = inquiryHref("ka", "comfort-house", "701");
  const url = new URL(href, "https://www.comfortbuilding.ge");
  assert.equal(url.searchParams.get("project"), "comfort-house");
  assert.equal(url.searchParams.get("interest"), "apartment-701");
  assert.equal(url.hash, "#inquiry");
  assert.equal(projectFromLocation(url.pathname, url.search, ["comfort-house"]), "comfort-house");
  assert.equal(projectFromLocation("/ru/projects/twins", "", ["comfort-house", "twins"]), "twins");
  assert.equal(projectFromLocation("/en/contact", "?project=not-a-real-project", ["comfort-house"]), "general");
});
