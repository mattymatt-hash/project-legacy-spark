# Update root metadata to the new tagline

## What

The homepage (`src/routes/index.tsx`) already uses "Real people. Real stuff. No nonsense.", but the sitewide defaults in `src/routes/__root.tsx` still carry the old tagline:

- title: "NoBS Market — Stuff worth owning, from people worth supporting"
- description: "An honest marketplace for handmade, vintage, and indie goods. No dropshippers. No drama."
- og:title / twitter:title / og:description / twitter:description: same old copy

## Change

Replace all six stale strings in `__root.tsx` `head()` with the new tagline so every page that falls back to root metadata (and social previews) stays consistent:

- title → "NoBS Market — Real people. Real stuff. No nonsense."
- description → "Real people. Real stuff. No nonsense. A marketplace for handmade, vintage, and indie goods from sellers who actually make them."
- og:title / twitter:title → "NoBS Market — Real people. Real stuff. No nonsense."
- og:description / twitter:description → same new description.

No other files change. The existing root `og:image` / `twitter:image` stay as-is.
