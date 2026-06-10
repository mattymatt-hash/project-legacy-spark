## Context

The uploaded zip (`trove-marketplace`) is a Next.js scaffold with no UI built. The only real artifact is a todo list for an MVP peer-to-peer marketplace. This Lovable project is on TanStack Start — I'll port the intent into this stack.

The brand is **NoBS Market**: a straight-to-the-point, indie, no-frills marketplace for makers, vintage sellers, and small brands.

## Scope (this iteration)

1. **Design system** in `src/styles.css`
   - Warm, modern marketplace palette (cream background, deep ink foreground, terracotta accent)
   - Fonts: Bricolage Grotesque (display/headings) + Hanken Grotesk (body) via Google Fonts in `__root.tsx`
   - Semantic tokens for surface/muted/accent/price/sale, soft shadows, generous radii

2. **Mock data layer** (`src/lib/mock/`)
   - Types: `Product`, `Seller`, `Category`, `Review`
   - ~24 products across 6 categories (Vintage, Handmade, Home, Fashion, Art, Collectibles), 6 sellers, reviews
   - Pure TS exports — no fetch, no async

3. **Client state** (React Context + localStorage)
   - `CartProvider` — add/remove/update qty, totals
   - `FavoritesProvider` — toggle/list
   - Mounted in `RootComponent`

4. **Shell components** (`src/components/layout/`)
   - `Navbar`: NoBS Market logo, search input, Sell button, Favorites, Cart (with badge), Account
   - `CategoryBar`: horizontal category links
   - `Footer`: marketing columns + newsletter input (non-functional)

5. **Routes**
   - `/` — hero, category tiles, "Trending now" grid, "New from indie sellers" rail, editorial section
   - `/browse` — grid with sidebar filters (category, price, condition) — UI-only this pass
   - `/product/$id` — gallery, title/price, seller card, description, shipping/returns, reviews, Add to cart / Favorite
   - `/cart` — line items, qty steppers, summary, Checkout button (links to /checkout)
   - Each route has its own `head()` with unique title + description + og tags

6. **Reusable UI** (`src/components/marketplace/`)
   - `ProductCard`, `CategoryTile`, `SellerBadge`, `PriceTag`, `RatingStars`
   - Built on existing shadcn primitives

## Explicitly out of scope (next iterations)

- `/checkout`, `/sell`, seller dashboard, store pages, order history
- Lovable Cloud (auth, DB, real persistence) — defer until UI is validated
- Stripe / shipping integrations

## Technical notes

- File-based routes: `product.$id.tsx`, `browse.tsx`, `cart.tsx`
- Fonts loaded via `<link>` in `__root.tsx` `head().links`
- Cart/Favorites contexts guard `localStorage` with `typeof window` for SSR safety
- Product images: Unsplash URLs (no asset uploads needed for mocks)
- Every route sets its own `head()` meta — no hash-anchor sections
