# Search and AI discovery plan for Comfort Building

Research date: 12 October 2026. Sources are the first-party documentation linked below. This report recommends work; it does not claim that production changes, business-profile verification, ranking gains, or AI citations have happened.

## What success should mean

The targets `ბინები ბათუმში` and `სამშენებლო კომპანია ბათუმში` are user-supplied goals, not measured keyword-volume findings. Treat them as apartment-buying and company-selection intents. Google recommends useful content, language searchers use in titles and headings, and crawlable links. It does not guarantee crawling, indexing, or serving even when a site follows its guidance. A first-page promise would be dishonest. [Google Search Essentials](https://developers.google.com/search/docs/essentials)

The implementation work should first improve the existing Georgian pages rather than create dozens of near-identical keyword pages. Keyword stuffing, doorway pages, and large volumes of content made to manipulate rankings can violate Google's spam policies. [Google spam policies](https://developers.google.com/search/docs/essentials/spam-policies)

## Priorities

| Priority | Recommendation for this site | Why and evidence |
| --- | --- | --- |
| 1 | Keep the Georgian apartment page as the main answer for `ბინები ბათუმში`. Put the phrase naturally in its title, main heading, and explanatory copy. Show real apartments, areas, floors, prices with currency, plans, availability, and a working inquiry path. | Google recommends the words people search for in prominent descriptive locations. Choosing this existing page is an implementation recommendation, not a documented ranking rule. [Search Essentials](https://developers.google.com/search/docs/essentials) |
| 1 | Make the home and about pages clearly identify Comfort Building as a construction company in Batumi. Use the actual project record, office, team, and contact information. Avoid unverified claims such as "number one", guaranteed rental returns, or current completion dates inferred from old material. | Original facts, clear sourcing, first-hand knowledge, and accuracy are part of Google's people-first content guidance. [Helpful content guidance](https://developers.google.com/search/docs/fundamentals/creating-helpful-content) |
| 1 | Check production access for public pages and images, including robots rules, CDN challenges, status codes, and `noindex`. Do not put essential inventory only inside an image or behind a client-only selection. | Google requires accessible pages, HTTP 200, and indexable content. [Technical requirements](https://developers.google.com/search/docs/essentials/technical). AI Search guidance also calls for important information in text. [AI features and your site](https://developers.google.com/search/docs/appearance/ai-features) |
| 1 | Publish one accurate page per real new project when Lasha supplies the materials. Keep a dated internal source for each sale status and price. Clearly distinguish architectural visualizations from photographs of completed work. | This is the proposed editorial process for Comfort Building. It follows Google's emphasis on original, accurate information and avoiding factual errors. [Helpful content guidance](https://developers.google.com/search/docs/fundamentals/creating-helpful-content) |
| 2 | Preserve separate ka/en/ru URLs with reciprocal, self-inclusive `hreflang` links. Each genuinely translated page should use the matching-language canonical, not canonicalize every language to Georgian. | Google documents `hreflang` for localized versions and treats versions as duplicates only when their main content remains untranslated. [Localized versions](https://developers.google.com/search/docs/specialty/international/localized-versions), [Canonicalization](https://developers.google.com/search/docs/crawling-indexing/canonicalization) |
| 2 | Link from the home page, portfolio, buying guide, and project pages to the apartment page with short descriptive Georgian link text. Link apartment inquiries back to their actual project. | Standard anchors with `href` and useful link text help Google find and understand linked pages. This is navigation work, not permission to add repetitive keyword blocks. [Link best practices](https://developers.google.com/search/docs/crawling-indexing/links-crawlable) |
| 2 | Keep the sitemap limited to preferred public URLs. Only update `lastmod` when the page has a significant content, structured-data, or link change. | Google ignores sitemap `priority` and `changefreq`. It uses `lastmod` when consistently accurate. New timestamps every build are not a documented freshness benefit. [Sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap) |
| 2 | Maintain one consistent organization identifier and truthful local-business, project, and breadcrumb data. Derive availability and offers from the same published inventory as the visible page. | Structured data must represent visible, relevant, current content. Fake ratings, hidden claims, or misleading facts are prohibited. [Structured-data guidelines](https://developers.google.com/search/docs/appearance/structured-data/sd-policies) |
| 2 | Audit mobile loading, layout shifts, and responsiveness with the real project pages and floor selector. Fix measured bottlenecks rather than chase a perfect score. | Core Web Vitals contribute to ranking systems, but good scores do not guarantee top results. Google recommends overall mobile and page experience. [Page experience guidance](https://developers.google.com/search/docs/appearance/page-experience) |
| 3 | Give actual photographs and plans useful alt text and nearby factual captions. Keep image URLs public and stable. | Google uses the surrounding page and alt text to understand images. It warns against keyword-stuffed alt attributes. [Image SEO guidance](https://developers.google.com/search/docs/appearance/google-images) |

## AI discovery, service by service

These are different products with different controls. Allowing a crawler makes content accessible; it does not buy a recommendation.

| Service | Practical action | Limit |
| --- | --- | --- |
| ChatGPT search | Allow `OAI-SearchBot` and avoid blocking its published IP ranges at the hosting layer. | `OAI-SearchBot` is the search crawler. `GPTBot` is for potential model-training use and is independent. `ChatGPT-User` is user-triggered access, not the bot that decides Search inclusion. [OpenAI crawler documentation](https://developers.openai.com/api/docs/bots) |
| Claude web search | Keep `Claude-SearchBot` and `Claude-User` able to retrieve the relevant public pages. | Anthropic distinguishes search indexing, user-initiated retrieval, and training. `ClaudeBot` is the training bot. Access supports discovery but gives no promised citation placement. [Anthropic crawler documentation](https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler) |
| Google AI Overviews and AI Mode | Keep pages indexed, snippet-eligible, crawlable, linked, and useful. | Google says there are no additional technical requirements and no special AI schema. Supporting links vary between queries and models. [AI features and your site](https://developers.google.com/search/docs/appearance/ai-features) |
| Gemini Apps | Keep useful source pages in Google's index and review `Google-Extended` policy deliberately. | `Google-Extended` controls use for both future Gemini training and grounding in Gemini Apps and some Vertex AI uses. It does not affect Google Search inclusion or ranking. There is no separate `Google-Extended` HTTP user-agent. [Google crawler documentation](https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers) |
| Bing and Microsoft AI experiences | Add the site to Bing Webmaster Tools and inspect crawl/index reports. Consider IndexNow for genuine additions, changes, and deletions after a publishing process exists. | Bing's AI Performance report covers Copilot, Bing AI summaries, and selected partners. It is not an all-provider ChatGPT/Gemini/Claude dashboard. [Bing AI Performance announcement](https://blogs.bing.com/webmaster/2026/2/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview/). IndexNow is notification, not guaranteed crawling or indexing. [IndexNow guidance](https://www2.bing.com/indexnow/getstarted) |

The current repository's `src/app/robots.ts` has a wildcard allow, so it does not need extra bot-specific groups merely to allow these crawlers. This is a local-source observation, not proof of the deployed robots file or CDN behavior. Explicit groups become useful when the owner wants different crawler policies. Do not silently change training permissions while pursuing search visibility.

Gemini's sources are not always present, and a related or double-check link is not necessarily the source used to generate the response. Test cited factual accuracy instead of treating one favorable answer as proof of lasting visibility. [Gemini source guidance](https://support.google.com/gemini/answer/14143489?hl=en)

## Avoid work that only looks like SEO

- Do not sell `llms.txt` as a ranking improvement. Google's June 2026 guidance says Search ignores it, so it neither helps nor harms Google visibility. A small, accurate file can still be maintained for systems that explicitly use it, but it has lower priority than public page content and crawler access. The OpenAI and Anthropic pages reviewed here do not establish it as a requirement for search inclusion. [Google AI optimization guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide), [OpenAI crawlers](https://developers.openai.com/api/docs/bots), [Anthropic crawlers](https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler)
- Keep useful buyer FAQs, but do not promise FAQ rich results. Google stopped showing this feature on 7 May 2026 and removed the documentation in June. [Google documentation updates](https://developers.google.com/search/updates)
- Valid `ApartmentComplex` or `RealEstateListing` vocabulary does not, by itself, establish a Google apartment-sale rich-result entitlement. Google's supported-feature gallery does not list an apartment-for-sale feature. Use accurate descriptive data, but do not promise product stars or property cards from it. This is an inference from the supported feature list. [Structured-data gallery](https://developers.google.com/search/docs/appearance/structured-data/search-gallery)
- Do not add made-up reviews, ratings, prices, or availability to JSON-LD. Do not include a self-serving aggregate rating for the company's own local-business rich result. [Structured-data guidelines](https://developers.google.com/search/docs/appearance/structured-data/sd-policies), [Local-business guidance](https://developers.google.com/search/docs/appearance/structured-data/local-business)
- Do not mass-publish AI-written pages for every neighborhood or keyword spelling. New pages should have a distinct purpose and owner-supplied information. [Spam policies](https://developers.google.com/search/docs/essentials/spam-policies)

## Owner work that code cannot replace

Verify or claim the real Google Business Profile. Confirm the actual business category, customer-facing address, hours, phone, and website with the owners before submitting them. Add actual project and office photographs, ask genuine customers for honest reviews, and respond to those reviews. Google says local results depend mainly on relevance, distance, and prominence, including links and reviews. There is no paid or requested ranking upgrade. [Google local-ranking guidance](https://support.google.com/business/answer/7091)

For Comfort Building, an owner-confirmed profile and credible project record are likely more valuable than another generic SEO paragraph. This is the researcher's prioritization, not a measured forecast. Obtain legitimate references from actual project partners, local coverage, or professional memberships where those relationships exist. Do not buy manufactured mentions or links. [Google local-ranking guidance](https://support.google.com/business/answer/7091), [Google AI optimization guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide), [Spam policies](https://developers.google.com/search/docs/essentials/spam-policies)

The next project package should include the exact address, owner-approved name, construction status and update date, original plans, floor/unit areas, confirmed prices and payment terms, amenities, and whether each image is a rendering or photograph. Publish only what the owner confirms. This is an editorial checklist derived from this site's task and Google's accuracy guidance. [Helpful content guidance](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)

## Measurement and remaining uncertainty

Use Search Console to separate branded queries from broad apartment/company queries, and inspect which URLs Google indexes and serves. Compare complete periods rather than individual-day excitement. Use GA4 to assess project-level inquiry and call-button conversions, not traffic alone. Google documents Search Console performance and complementary conversion measurement for AI Search traffic. The period comparison and brand split are proposed reporting choices for this project. [AI features and measurement](https://developers.google.com/search/docs/appearance/ai-features)

Keep a small repeated prompt set in Georgian, English, and Russian. Record the date, product, whether web search ran, cited URLs, and whether prices/statuses are accurate. This is an evaluation plan, not a ranking technique. Do not use your own prompted mentions to claim that unprompted general recommendations have improved.

Unverified items at research handoff:

- Production crawler access and response headers; local robots source alone does not prove them.
- Georgian query volume, competitor strength, current broad-query positions, and whether traffic is branded.
- The existence, ownership, verification, and correctness of a Google Business Profile or Bing Places entry.
- Which AI providers have crawled this site, and whether they cite it for general buyer prompts.
- Owner-confirmed freshness of the existing apartment inventory and the incoming new-project materials.

No primary source reviewed promises first-page placement or guaranteed recommendations in ChatGPT, Gemini, or Claude. The controllable work is accurate content, crawl/index eligibility, useful navigation, a reliable mobile experience, and real local-business evidence.

## Public Maps listing check

Checked on 12 October 2026, read-only. No exact matching Comfort Building business profile was verified.

The official contact page publishes `+995 555 92 20 20`, `comfbuilding@gmail.com`, and the office at 51-53 E. Takaishvili Street in Batumi. Its Maps link opens a street-address search using `Takaishvili Street 51, Batumi, Georgia`; it is not a dedicated company-place link. [Official contact page](https://www.comfortbuilding.ge/ka/contact)

Direct public Google Maps observations:

- `Comfort Building Batumi` returned Comfort Palace results. Their displayed addresses, telephone numbers, and websites differed from Comfort Building's official contact information. These are not verified matches. One result was [Comfort Palace at 24a Tbel-Abuseridze Street](https://www.google.com/maps/place/Comfort+Palace/data=!4m7!3m6!1s0x4067850030ce065f:0xd84e417387b808b2!8m2!3d41.633711!4d41.6162606!16s%2Fg%2F11lcyct87q!19sChIJXwbOMACFZ0ARsgi4h3NBTtg), with phone `511 44 00 22` and `comfort-palace.info`.
- The exact public telephone search `+995555922020` displayed `Google Maps can't find +995555922020`.
- `კომფორტ ბილდინგი ბათუმი` returned other businesses rather than an identifiable exact match.
- The published-office-address search did not identify an exact Comfort Building business profile.

The name and phone searches are reproducible through Maps' own search box. Public web searches for the company's English and Georgian names, `comfbuilding`, and exact phone also did not yield an exact Google Maps business-profile link. Facebook and Instagram pages linked from the official contact page could not be fetched by the public web-reading tool, so their profile fields remain unchecked.

This does not prove that no profile exists. It may use an older name, another phone, a project name, or a different pin. It also says nothing about verification or account ownership. Before creating a new profile, ask the owners whether they or the previous developer have a Google Maps share link or a Business Profile in an account they control. If they find an existing listing, inspect that exact listing before claiming or creating anything. No account was created, no listing was claimed, and no public business data was changed during this check.
