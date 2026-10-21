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
npm run check:explorer
```

Run `npm run check:seo` against a running production build. Use `SEO_BASE_URL` when it is not on port 3000.
Run `npm run check:search-content` against the same server to check readable headings and complete, non-duplicated business/project entities on every sitemap page.
Run `npm run check:inquiry-endpoint` against the development server on port 3001, or set `INQUIRY_BASE_URL`. This check sends only invalid requests and does not send emails.
For a locally served production build, also set `INQUIRY_ORIGIN=https://www.comfortbuilding.ge`; production intentionally rejects localhost origins.

## Parnavaz Mepe St. №65 apartment explorer

The project page has an eight-floor facade selector and seven furnished Three.js apartment concepts reconstructed from the supplied design boards. Floor outlines use the original facade image's coordinate system; preserve its full aspect ratio when changing the layout.

Apartment availability and prices come from the project price list. Models match exact apartment areas only: 45.7, 46.5, 50.1, 55.1, 55.3, 76.4, and 117 m². Units without a matching board show a plan inquiry instead of an unrelated model. The furniture and finishes are illustrative, not construction drawings.

The AI-made design boards are not drawn to scale, so each model in `src/lib/parnavaz-apartment-models.ts` maps board pixels to metres measured on the floor VI architectural plan from the sales team's price sheet (all seven types appear on that floor). Room depths and wall positions therefore follow the plan, within roughly 10 cm; the 117 m² type uses one calibration zone per room group because its board's rooms are proportioned differently. Doors, glazing, windows, balcony railings and floor finishes are traced as openings and floor areas, and wall-hung pieces and the ceiling appear only in interior views. Six models also add 0.2–0.4 m of extra floor in tight walkways (each model's `widen` entry) so the 3D views and walkthrough feel less cramped; furniture keeps its real size, and every published area, price and dimension in the page text is unchanged. Also 3D only: interior doors narrower than 0.76 m are opened up into the wall beside them, and wall-backed furniture (beds with their nightstands, kitchens, wardrobes, bathroom fittings) is moved back onto the real wall face, because the boards draw walls two to three times their real thickness. Apartment 704 opts out (`refine: false`) because its hand-built interior places its own doors and furniture.

Every trace except 704's was audited against its Japandi board at 2–5× zoom, with the architectural plan used to settle walls and windows. Traces record what the boards show:
- structural columns (`columns`, standard 45 cm or a traced size);
- fixed floor-to-ceiling `glazing` beside glazed balcony doors;
- double-leaf doors, with each door's hinge side;
- cistern ledges (`ledge`);
- round rugs, nightstands, tables and corner showers (`shape: "round"`);
- where each kitchen's hob and sink sit (`fittings`).

Fixed glazing, windows and columns are solid in the walkthrough. Wall snapping stops at a headboard shelf or ledge behind a piece, and never pulls a piece back across other furniture. Two deliberate deviations: the 45.70 and 55.30 boards also draw a TV behind the sofa, and the models leave those out.

The working Three.js viewer is currently enabled only by `npm run dev`, through the compile-time `NODE_ENV === "development"` gate in `parnavaz-explorer.tsx`. Production and preview builds show a localized "3D coming soon" panel instead, with the supplied design, prices, and inquiry link still available. Do not remove this gate until the 3D release is approved.

All seven model definitions and the viewer remain in source control for continued local development. The viewer supports orbit, room views, top view, and a supplied-design fallback. Inquiry links retain both the project and apartment number; numbers are not unique across projects.

### Desktop walkthrough prototype

Run `npm run dev`, open `/en/projects/parnavaz-65#explore`, choose floor 7, then apartment 704. Its 46.5 m² interior uses a more detailed reconstruction of the supplied design board. The top-right person icon opens an experimental notice before entering first-person mode.

Use WASD or the arrow keys to move, the mouse to look, and Escape to pause and release the cursor. If the browser does not allow pointer lock, click the scene and drag to look while using WASD. Room buttons move to clear starting positions in the living room, bedroom, and kitchen. The small plan shows your position and direction.

Every apartment with a 3D model has the walkthrough, on desktop devices with a fine pointer and a viewport at least 900px wide. The dimensions and finishes remain approximate; this is not a measured walkthrough. Production still shows "3D coming soon".

When the site is opened or refreshed, a small construction scene plays over the page (`site-loader.tsx`): blocks drop in and the crane sets the Comfort Building medallion on the tower, then the curtain lifts at about 2.9 s. The lift is pure CSS, so the page underneath is always in the HTML and appears even if JavaScript is slow; hero entrances wait for the lift. Client-side navigation does not replay it, and reduced motion or no JavaScript skips it.

Walkthrough bonus: aim the crosshair at a TV within reach and an "E" prompt appears in Georgian, English or Russian. E switches the screen to a short brand channel (`apartment-tv.ts`): a tube-style power-on, the CB monogram traced along its arc with a gold sweep, the wordmark, and slow brass dust, with a soft glow on the room. Leaving the walkthrough switches every TV off.

`npm run check:walkthrough` exercises the real movement and input modules, including doorway passage, walls, furniture, balcony edges, key cleanup, Escape, and delayed pointer-lock responses.

All interiors share the procedural color, bump, and roughness textures in `src/components/apartment-surfaces.ts`. Apartment 704 has a hand-built interior; the other six types are furnished by `apartment-generic-interior.ts`, which in the walkthrough adds warm room lights, dining pendants, and daylight beyond the glazing, with the sun entering through each layout's balcony doors. The walkthrough adds contact shadows and neutral color output, with glass and sheer curtains excluded from the occlusion pass. These effects load on first entry and cap their render targets at two megapixels. The ordinary 3D and top views keep their direct rendering path.

`npm run check:rendering` checks the real Three.js postprocessing passes, resource disposal, texture color spaces, and the ceiling/floor coverage across widened walkways. Compare the living-room and bedroom views in the browser as well; these tests do not judge visual quality.

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
