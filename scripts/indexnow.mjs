// Tells Bing and Yandex (and other IndexNow engines) which pages changed, so
// they recrawl within minutes instead of waiting for their next visit.
// Run after a production deploy:
//   npm run indexnow              submit every URL in the live sitemap
//   npm run indexnow -- /ru/apartments /ka/projects/parnavaz-65
//   npm run indexnow -- --dry-run print the request without sending it
import assert from "node:assert/strict";

// Public by design: engines fetch https://www.comfortbuilding.ge/<key>.txt to
// confirm the request comes from the site owner.
const key = "3807fe6a787cfd1d790b54a912f4e6d6";
const site = new URL(process.env.INDEXNOW_SITE ?? "https://www.comfortbuilding.ge");
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const paths = args.filter((arg) => arg !== "--dry-run");

let urlList;
if (paths.length > 0) {
  urlList = paths.map((path) => new URL(path, site).toString());
} else {
  const sitemap = await fetch(new URL("/sitemap.xml", site));
  assert.equal(sitemap.status, 200, "the live sitemap must be reachable");
  urlList = Array.from((await sitemap.text()).matchAll(/<loc>([^<]+)<\/loc>/g), (match) => match[1]);
}
assert.ok(urlList.length > 0, "no URLs to submit");

const keyFile = await fetch(new URL(`/${key}.txt`, site));
assert.equal(keyFile.status, 200, `/${key}.txt must be deployed before submitting`);
assert.equal((await keyFile.text()).trim(), key, "the deployed key file must contain the key");

const body = { host: site.host, key, keyLocation: new URL(`/${key}.txt`, site).toString(), urlList };
if (dryRun) {
  console.log(JSON.stringify(body, null, 2));
  process.exit(0);
}

const response = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "content-type": "application/json; charset=utf-8" },
  body: JSON.stringify(body),
});
// 200 and 202 both mean accepted; 202 while the key is still being checked.
assert.ok([200, 202].includes(response.status), `IndexNow returned ${response.status}: ${await response.text()}`);
console.log(`IndexNow accepted ${urlList.length} URLs (HTTP ${response.status}).`);
