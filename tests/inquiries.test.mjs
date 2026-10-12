import assert from "node:assert/strict";
import { test } from "node:test";
import { inquiryEmailText, parseInquiry } from "../src/lib/inquiry-validation.ts";

const projects = [
  { slug: "comfort-house", name: "Comfort House", apartments: [{ id: "703", number: "703" }] },
  { slug: "twins", name: "Twins", apartments: [] },
];
const inquiry = {
  name: "Website test", contact: "test@example.com", message: "I would like a viewing.",
  lang: "en", projectSlug: "comfort-house", topic: "apartment", unitId: "703", website: "",
  requestId: "07ae9c32-3cac-4a10-99bd-640a52b0d41f",
};

test("email and analytics context come from a real project and its available apartment", () => {
  const result = parseInquiry({ ...inquiry, to: "attacker@example.com", projectName: "Fake project" }, projects);
  assert.equal(result.ok, true);
  assert.equal(result.inquiry.projectName, "Comfort House");
  assert.equal(result.inquiry.apartmentNumber, "703");
  assert.ok(!("to" in result.inquiry));
  assert.ok(!inquiryEmailText(result.inquiry).includes("Fake project"));
});

test("a unit cannot be attributed to another project or a sold/unpublished unit", () => {
  assert.equal(parseInquiry({ ...inquiry, projectSlug: "twins" }, projects).ok, false);
  assert.equal(parseInquiry({ ...inquiry, unitId: "sold-unit" }, projects).ok, false);
  assert.equal(parseInquiry({ ...inquiry, projectSlug: "not-a-project" }, projects).ok, false);
});

test("general inquiries remain usable without an apartment or analytics consent", () => {
  const result = parseInquiry({ ...inquiry, projectSlug: "general", topic: "general", unitId: "", contact: "+995 555 92 20 20" }, projects);
  assert.equal(result.ok, true);
  assert.equal(result.inquiry.projectSlug, "general");
  assert.equal(result.inquiry.apartmentNumber, undefined);
});

test("malformed contacts, honeypots, oversized messages and header injection fail validation", () => {
  for (const override of [
    { contact: "not an email or phone" }, { contact: "test@example.com\r\nBcc: attacker@example.com" },
    { name: "Test\r\nInjected" }, { website: "spam.example" }, { message: "a".repeat(3001) },
    { lang: "xx" }, { requestId: "not-a-uuid" },
  ]) assert.equal(parseInquiry({ ...inquiry, ...override }, projects).ok, false, JSON.stringify(override));
});
