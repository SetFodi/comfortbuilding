# Comfort Building

A trilingual redesign of [comfortbuilding.ge](https://comfortbuilding.ge), built with Next.js 16, React 19, TypeScript, and Tailwind CSS 4.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. The root redirects to Georgian; `/ka`, `/en`, and `/ru` contain the complete localized site.

## Verification

```bash
npm run lint
npx tsc --noEmit
npm run build
npm run check:analytics
npm run check:inquiries
npm run check:carousel
```

Run `npm run check:seo` against a running production build. Use `SEO_BASE_URL` when it is not on port 3000.
Run `npm run check:search-content` against the same server to check readable headings and complete, non-duplicated business/project entities on every sitemap page.
Run `npm run check:inquiry-endpoint` against the development server on port 3001, or set `INQUIRY_BASE_URL`. This check sends only invalid requests and does not send emails.
For a locally served production build, also set `INQUIRY_ORIGIN=https://www.comfortbuilding.ge`; production intentionally rejects localhost origins.

## Inquiry delivery and analytics

The contact form posts to `/api/inquiries` and sends a plain-text message through Resend to `comfbuilding@gmail.com`. The sender is `inquiries@mail.comfortbuilding.ge`; that sending domain is verified. `RESEND_API_KEY` is a server-only Vercel Secret in Production, Preview, and Development. Never give it a `NEXT_PUBLIC_` prefix or commit an environment file containing it.

For local verification, set `INQUIRY_TEST_MODE=true` in the ignored `.env.development.local`. Development submissions then go to Resend's `delivered@resend.dev` test address. This override cannot activate in production. Removing it sends local submissions to the sales team, so do not remove it for automated tests.

The endpoint validates the current project and available apartment, caps request size, checks the origin, rejects a honeypot and uses Resend idempotency keys for retries. It also has an instance-local submission limit, not a distributed limit. Configure a platform-level limit on `/api/inquiries` if abuse or traffic warrants it. The form is not a persistent CRM; accepted messages remain in the sales inbox and the email provider.

Google Analytics property `Comfort Building` uses public measurement ID `G-7MVXJB4KKS`. The Google tag loads only after analytics consent. `phone_click` measures a call-button click, not a completed phone call. `generate_lead` measures an inquiry accepted by the email provider, not a sale. That event is marked as a key event without an assigned monetary value.

Events include `project_slug`, `contact_placement`, `site_language`, and an optional public `apartment_number`. Names, phone numbers, email addresses, messages and URL query strings are not sent to Analytics. In GA4 Explore, use Project as a row dimension and Event name as a column dimension, with Event count as the value. Filter to `phone_click` and `generate_lead`. New custom dimensions can take time to become available in processed reports; DebugView is the immediate integration check.

## Content provenance

Project descriptions, dates, specifications, addresses, floor plans, and the original photography were migrated from Comfort Building's existing official website. Selected covers and listing-only images are clearly described AI-enhanced derivatives of those official images; the originals remain available in each project gallery. No placeholder projects or invented buildings are used.

Price, availability, sold percentage, and project status are time-sensitive. The interface identifies those values as source-published data and asks visitors to confirm current details with the company. The Georgian source page is treated as canonical where localized versions disagree.

## Search and AI discovery

The Georgian homepage answers construction-company queries; `/ka/apartments` is the buying catalogue for apartments in Batumi; `/ka/projects` documents the portfolio in Batumi and Tbilisi. Keep these purposes distinct when adding a real project. The English and Russian versions have their own canonicals and reciprocal language links.

Every localized page defines the same company and website identities. Project pages link their webpage entity to the actual apartment complex. Published apartment counts are derived from the inventory; prices and sale statuses must still be maintained from owner-confirmed information. Do not add ratings, awards, founding dates, payment terms or current completion claims without a source.

`SITE_UPDATED_AT` is a manually maintained content/structured-data revision date, not an automatic build timestamp or an inventory confirmation date. The buyer guide retains its original publication date. Update dates only for real page changes.

The robots policy allows public search crawlers, including AI search crawlers. Access is not a ranking or recommendation guarantee. There is no special AI schema or `llms.txt` requirement for Google Search. See [the primary-source research and owner checklist](docs/seo-ai-discoverability-research.md) for crawler distinctions, Business Profile steps and measurement.

After an authorized production release, rerun both SEO checks against `https://www.comfortbuilding.ge`, inspect the changed URLs in Search Console, and confirm the sitemap remains accepted. Compare complete 28-day periods for non-brand queries, clicks and project-level inquiry/call-button events. Call clicks are not completed calls, and accepted inquiries are not sales.

Next.js, React and compatible transitive dependencies were updated on 12 October 2026. Production dependency audit has no currently reported vulnerabilities. Development tooling still has an unpatched `braces` chain; do not use `npm audit fix --force` to downgrade Next's ESLint configuration. Check the announced 14 October Next.js security release when it becomes available: [official notice](https://nextjs.org/blog/upcoming-nextjs-security-update-october-2026).
