# SEO improvements for NoBS Market

## What I found

- **Root metadata is stale.** `src/routes/__root.tsx` still uses the old tagline ("Stuff worth owning, from people worth supporting" / "An honest marketplace...") instead of the new "Real people. Real stuff. No nonsense." that the homepage now uses.
- **No canonical tags** on any route. Without them crawlers can index duplicate URLs.
- **No `og:url` self-referencing** on any route — `og:*` tags can be misattributed.
- **No `og:type` on leaf routes.** Product pages should declare `og:type: "product"`; browse/store should declare `og:type: "website"`.
- **No structured data (JSON-LD).** Product pages have no `Product` schema, store pages have no `Store`/`Organization` schema, and no `BreadcrumbList` anywhere. This blocks rich results.
- **No robots.txt or sitemap.xml.** The `public/` directory does not exist, so crawlers get nothing.
- **Browse page has no Open Graph tags** (only title + description).

## Recommended changes

1. **Update root metadata to the new tagline** so the sitewide title, description, og:title, og:description, twitter:title, and twitter:description all say "Real people. Real stuff. No nonsense."

2. **Add canonical + `og:url` self-referencing** to every leaf route (`/`, `/browse`, `/product/$id`, `/store/$handle`, `/cart`, `/auth`, etc.), pointing at `https://project-legacy-spark.lovable.app/<path>`.

3. **Add `og:type`** to leaf routes: `"product"` on `/product/$id`, `"website"` on `/`, `/browse`, `/store/$handle`.

4. **Add JSON-LD structured data:**
   - `Product` + `Offer` schema on `/product/$id` (name, image, price, availability, rating).
   - `Store`/`Organization` schema on `/store/$handle` (name, description, image, rating).
   - `BreadcrumbList` on product and store pages (Home > Browse > Product / Store).
   - `WebSite`/`Organization` sitewide schema in `__root.tsx`.

5. **Add Open Graph tags to `/browse`** (title, description, og:title, og:description, og:url, og:type).

6. **Create `public/robots.txt` and `public/sitemap.xml`** so crawlers can discover and index all public listing and store pages. robots.txt points to the sitemap.

## Technical notes

- Canonical tags go in the `links` array of each leaf route's `head()`, never in `__root.tsx` (links concatenate and would duplicate).
- JSON-LD goes in the `scripts` array as `{ type: "application/ld+json", children: JSON.stringify(...) }`.
- All canonical/og:url values use `https://project-legacy-spark.lovable.app` as the base.
- Product/store schema pulls from existing loader data, so no new queries needed.

## Not included

- Generating new `og:image` art (current root og:image still points at the old preview screenshot). I can refresh it if you want, but it's optional.
- No content creation (blog, category landing pages) — this plan is purely technical SEO hygiene.
