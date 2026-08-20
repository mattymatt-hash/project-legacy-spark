# NoBS Market

A peer-to-peer marketplace where anyone can open a store, list products, and get
paid — with Stripe Connect payouts, EasyPost shipping labels, reviews, favorites,
notifications, and an admin moderation dashboard.

## Tech stack

| Concern    | Choice |
| ---------- | ------ |
| Framework  | [TanStack Start](https://tanstack.com/start) v1 (React 19, SSR + server functions) |
| Build tool | Vite 7 |
| Routing    | TanStack Router (file-based, `src/routes/`) |
| Data       | TanStack Query |
| Styling    | Tailwind CSS v4 (`src/styles.css`) + shadcn/ui (Radix) |
| Backend    | Supabase (Postgres, Auth, Storage, RLS) |
| Payments   | Stripe Connect (Express accounts, 10% platform fee) |
| Shipping   | EasyPost (live rates + label purchase) |
| Deploy     | Cloudflare Workers (default). Any Node/edge host works via a Nitro preset. |

## Getting started

```bash
npm install
cp .env.example .env    # then fill in the values
npm run dev             # http://localhost:8080
```

### Scripts

| Script | What it does |
| ------ | ------------ |
| `npm run dev` | Dev server with HMR |
| `npm run build` | Production build (`.output/`) |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

## Backend setup (Supabase)

1. Create a Supabase project.
2. Apply the SQL in `supabase/migrations/` in filename order — either with the
   Supabase CLI (`supabase db push`) or by pasting each file into the SQL editor.
   These create: `profiles`, `stores`, `listings`, `orders`, `order_items`,
   `reviews`, `notifications`, `user_roles`, plus RLS policies, grants, and the
   rating-aggregate triggers.
3. Create three Storage buckets (private): `avatars`, `listing-images`. The
   RLS policies on `storage.objects` ship with the migrations.
4. Enable the Google provider under Authentication → Providers if you want
   social sign-in, and turn on email confirmations.
5. Grant yourself admin access once:

   ```sql
   insert into public.user_roles (user_id, role)
   values ('<your-auth-user-id>', 'admin');
   ```

## Stripe

- Add `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` to `.env`.
- Add a webhook endpoint pointing at `POST /api/public/stripe-webhook` and
  subscribe to `checkout.session.completed`, `charge.refunded`,
  `refund.created`, and `refund.updated`.
- Locally: `stripe listen --forward-to localhost:8080/api/public/stripe-webhook`.

## EasyPost

Add `EASYPOST_API_KEY`. Sellers set a ship-from address in their dashboard and
per-listing parcel dimensions; buyers pick a live rate at checkout.

## Project layout

```
src/
  routes/           file-based routes (pages + /api server routes)
    _authenticated/ signed-in-only subtree (auth gate in route.tsx)
    api/public/     unauthenticated HTTP endpoints (Stripe webhook)
  lib/
    *.functions.ts  server functions (typed RPC, run on the server)
    *.server.ts     server-only helpers (Stripe, EasyPost)
    store/          client-side cart & favorites contexts
  components/       layout, marketplace, seller, orders, ui (shadcn)
  integrations/     generated Supabase clients, auth middleware
supabase/migrations/  database schema history
```

## Deployment

The build targets Cloudflare Workers by default (Nitro). To deploy elsewhere,
set a different Nitro preset (`node-server`, `vercel`, `netlify`, …) in
`vite.config.ts`. All environment variables above must be configured as
secrets on the host — server-only values must never be exposed with a `VITE_`
prefix.

## Note on hosted-platform packages

Two packages come from the original hosting platform:

- `@lovable.dev/vite-tanstack-config` — the shared Vite preset (TanStack Start,
  React, Tailwind, Nitro, path aliases). Public on npm; keep it, or inline an
  equivalent Vite config if you'd rather own it.
- `@lovable.dev/cloud-auth-js` — the Google OAuth broker used by
  `src/integrations/lovable/index.ts`. If you self-host, swap that helper for
  `supabase.auth.signInWithOAuth("google", …)` and remove the dependency.
