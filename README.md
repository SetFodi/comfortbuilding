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
```

## Content provenance

Project descriptions, dates, specifications, addresses, floor plans, and the original photography were migrated from Comfort Building's existing official website. Selected covers and listing-only images are clearly described AI-enhanced derivatives of those official images; the originals remain available in each project gallery. No placeholder projects or invented buildings are used.

Price, availability, sold percentage, and project status are time-sensitive. The interface identifies those values as source-published data and asks visitors to confirm current details with the company. The Georgian source page is treated as canonical where localized versions disagree.
