import assert from "node:assert/strict";

const base = process.env.INQUIRY_BASE_URL ?? "http://127.0.0.1:3001";
// A locally served production build deliberately rejects localhost origins.
// Set the real public origin to exercise its validation path without changing
// the application's production origin policy.
const testOrigin = process.env.INQUIRY_ORIGIN ?? new URL(base).origin;
const endpoint = new URL("/api/inquiries", base);
const body = {
  name: "Validation test", contact: "delivered@resend.dev", message: "Validation test only.",
  lang: "en", projectSlug: "comfort-house", topic: "apartment", unitId: "703", website: "",
  requestId: "07ae9c32-3cac-4a10-99bd-640a52b0d41f",
};
// Every POST below is deliberately invalid and must return before email sending.
for (const [change, expected, origin] of [
  [{ contact: "invalid contact" }, "contact"],
  [{ projectSlug: "twins" }, "apartment"],
  [{ projectSlug: "not-a-project" }, "project"],
  [{ unitId: "702" }, "apartment"],
  [{ website: "spam.example" }, "invalid"],
  [{ requestId: "invalid" }, "invalid"],
  [{ message: "x".repeat(3001) }, "message"],
  [{ contact: "invalid contact" }, "origin", "https://unrelated.example"],
]) {
  const result = await fetch(endpoint, {
    method: "POST", headers: { "Content-Type": "application/json", Origin: origin ?? testOrigin },
    body: JSON.stringify({ ...body, ...change }),
  });
  assert.equal(result.status, expected === "origin" ? 403 : 400);
  assert.equal((await result.json()).error, expected);
}
assert.equal((await fetch(endpoint)).status, 405);
console.log("Inquiry endpoint check passed: validation, project ownership, unavailable units, honeypot, origin, and GET rejection. No emails sent.");
