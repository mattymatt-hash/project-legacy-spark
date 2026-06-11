## NoBS Market — Backend & Marketplace Buildout

Building on the UI we already have, in 4 phases. Each phase ends in a working, demoable slice.

---

### Phase 1 — Auth + Seller Onboarding

**Enable Lovable Cloud** (database, auth, storage, server functions, secrets).

Auth methods: email/password + Google sign-in. Password reset page included.

**Schema**
- `profiles` — `id` (FK `auth.users`), `display_name`, `avatar_url`, `created_at`. Trigger auto-creates row on signup.
- `stores` — `id`, `owner_id` (FK `auth.users`, unique), `handle` (unique slug), `name`, `bio`, `logo_url`, `banner_url`, `stripe_account_id` nullable, `stripe_charges_enabled` bool, `created_at`.
- RLS: profile/store rows readable by all; writable only by owner. Standard grants per platform rules.

**Routes**
- `/auth` — sign in / sign up (tabs), Google button, "Forgot password" link.
- `/reset-password` — public, handles `type=recovery` and calls `updateUser({ password })`.
- `/_authenticated/` — integration-managed gate (already shipped by Cloud).
- `/_authenticated/account` — profile edit.
- `/_authenticated/sell` — "Open your store" form (handle, name, bio) → creates `stores` row → redirects to seller dashboard. Any signed-in user can open a store instantly.
- `/store/$handle` — public storefront (listings will fill in Phase 2).

Navbar updates: show "Sign in" when logged out; show avatar menu (Account, Your store, Sign out) when logged in.

---

### Phase 2 — Listings + Storefronts

**Schema**
- `listings` — `id`, `store_id` (FK), `title`, `slug`, `description`, `price_cents`, `currency` default `usd`, `condition` enum, `category` text, `stock` int, `weight_oz` numeric (needed for shipping), `status` enum (`draft`/`active`/`sold`/`archived`), `created_at`.
- `listing_images` — `id`, `listing_id`, `storage_path`, `position`.
- Storage bucket `listings` (public read, owner-only write).
- RLS: anyone reads `active` listings; only store owner writes/reads own drafts.

**Routes (all under `/_authenticated/seller/`)**
- `/seller` — dashboard: listings table, sales summary placeholder.
- `/seller/listings/new` — create form (multi-image upload via Cloud Storage, drag-reorder).
- `/seller/listings/$id/edit` — edit/archive.

**Public route updates**
- `/store/$handle` — load store + active listings via server fn.
- Replace mock data in `/`, `/browse`, `/product/$id` with real `listings` queries via `createServerFn`. Keep current card UI.
- `head()` per route fed by loader data for SEO (title, description, og:image from first listing image).

---

### Phase 3 — Cart → Checkout → Orders (Stripe Connect, 10% platform fee)

**Stripe Connect setup**
- Use the BYOK Stripe integration (the seamless one is single-merchant and won't do Connect payouts). You provide `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` when prompted.
- Express accounts for sellers (lightest onboarding).

**Schema**
- `orders` — `id`, `buyer_id`, `store_id`, `stripe_payment_intent_id`, `stripe_checkout_session_id`, `subtotal_cents`, `shipping_cents`, `platform_fee_cents`, `total_cents`, `status` enum (`pending`/`paid`/`shipped`/`delivered`/`refunded`/`canceled`), `shipping_address` jsonb, `created_at`.
- `order_items` — `id`, `order_id`, `listing_id`, `title_snapshot`, `price_cents_snapshot`, `qty`.
- RLS: buyer reads own orders; store owner reads orders for their store.

**Server functions**
- `createConnectAccount` → Stripe `accounts.create` (Express), store id on `stores`.
- `createAccountLink` → returns onboarding URL; seller dashboard surfaces "Finish payout setup" until `charges_enabled`.
- `createCheckoutSession` → one cart = one seller (MVP constraint; multi-seller carts split into multiple sessions later). Uses `payment_intent_data.application_fee_amount = round(subtotal * 0.10)` and `transfer_data.destination = seller.stripe_account_id`.

**Server route (webhook)**
- `/api/public/stripe-webhook` — verifies signature, on `checkout.session.completed` creates `orders` + `order_items`, marks listings sold if stock hits 0.

**Routes**
- `/cart` — already exists; wire to real listings + checkout button.
- `/checkout/success?session_id=...` — confirmation.
- `/_authenticated/orders` — buyer order history.
- `/_authenticated/seller/orders` — seller sales list.

---

### Phase 4 — Shipping (EasyPost)

Stored secret: `EASYPOST_API_KEY` (you'll paste it when prompted).

**Schema additions**
- `stores`: `ship_from_address` jsonb (street, city, state, zip, country).
- `orders`: `easypost_shipment_id`, `easypost_tracker_id`, `tracking_code`, `carrier`, `label_url`, `tracking_status`.

**Server functions** (all wrap EasyPost REST via `fetch`)
- `getShippingRates({ orderId })` — buys/creates a shipment using buyer address + store ship-from + item weights, returns rates.
- `buyLabel({ orderId, rateId })` — purchases label, saves `label_url` + tracking, updates order to `shipped`.
- `getTracking({ orderId })` — refreshes status from EasyPost.

**Server route**
- `/api/public/easypost-webhook` — verifies signature, updates `tracking_status` and flips order to `delivered` when applicable.

**Routes**
- `/checkout` — collects shipping address before creating session; rate selection inline.
- `/_authenticated/seller/orders/$id` — "Buy label" button → shows label PDF link + tracking.
- `/_authenticated/orders/$id` — buyer sees tracking timeline.

---

### Out of scope (for now)
- Reviews/ratings persistence (mock UI stays).
- Multi-seller cart split (single-seller checkout in Phase 3).
- Admin moderation dashboard.
- Refunds UI (Stripe dashboard for MVP).
- 2FA (can add later via Cloud auth settings).
- Email notifications (add after Phase 3 with Resend connector).

### Technical notes
- All Supabase access via `createServerFn` (`requireSupabaseAuth` for user-scoped writes; `supabaseAdmin` for webhooks). Loaders call server fns, never query Supabase directly.
- Stripe + EasyPost SDKs are Node-only — use direct `fetch` to their REST APIs from server fns (Worker-compatible).
- Money stored in integer cents everywhere.
- Each public route sets unique `head()` with loader-driven OG tags.

### Secrets you'll need to provide
- Phase 3: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PUBLISHABLE_KEY`
- Phase 4: `EASYPOST_API_KEY`, `EASYPOST_WEBHOOK_SECRET`

Approve to start Phase 1.
