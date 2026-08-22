import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { SiteShell } from "@/components/layout/SiteShell";
import { CategoryTile } from "@/components/marketplace/CategoryTile";
import { ListingCard } from "@/components/marketplace/ListingCard";
import { ListingGrid as ListingGridSkeleton } from "@/components/marketplace/skeletons";
import { getActiveListings } from "@/lib/listings.functions";
import { categories } from "@/lib/mock/data";
import { ArrowRight } from "lucide-react";

const homeListingsQuery = queryOptions({
  queryKey: ["listings", "home"],
  queryFn: () => getActiveListings({ data: { sort: "new", limit: 24 } }),
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NoBS Market — Honest goods from real people" },
      { name: "description", content: "Discover handmade, vintage, and indie goods from sellers who care. No dropshippers, no drama." },
      { property: "og:title", content: "NoBS Market" },
      { property: "og:description", content: "Honest goods from real people." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(homeListingsQuery),
  errorComponent: ({ error }) => (
    <SiteShell>
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="font-display text-2xl font-bold">Something broke</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
      </div>
    </SiteShell>
  ),
  notFoundComponent: () => <SiteShell><div className="p-12 text-center">Not found</div></SiteShell>,
  pendingComponent: () => (
    <SiteShell>
      <section className="border-b">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 md:grid-cols-2 md:items-center md:py-20">
          <div className="space-y-5">
            <div className="h-6 w-40 animate-pulse rounded-full bg-muted" />
            <div className="h-14 w-11/12 animate-pulse rounded-md bg-muted" />
            <div className="h-14 w-3/4 animate-pulse rounded-md bg-muted" />
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
            <div className="flex gap-3">
              <div className="h-11 w-40 animate-pulse rounded-full bg-muted" />
              <div className="h-11 w-32 animate-pulse rounded-full bg-muted" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={`aspect-[3/4] w-full animate-pulse rounded-2xl bg-muted ${i % 2 ? "mt-8" : ""}`} />
            ))}
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="h-8 w-56 animate-pulse rounded bg-muted" />
        <div className="mt-6">
          <ListingGridSkeleton count={8} />
        </div>
      </section>
    </SiteShell>
  ),
  component: Index,
});

function Index() {
  const { data: listings } = useSuspenseQuery(homeListingsQuery);
  const trending = listings.slice(0, 8);
  const fresh = listings.slice(8, 14);
  const drop = listings.slice(0, 6);

  return (
    <SiteShell>
      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 md:grid-cols-2 md:items-center md:py-20">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" /> New sellers every week
            </span>
            <h1 className="mt-4 font-display text-4xl font-bold leading-tight sm:text-5xl md:text-6xl">
              A marketplace<br />without the <span style={{ color: "var(--color-primary)" }}>BS</span>.
            </h1>
            <p className="mt-5 max-w-md text-base text-muted-foreground sm:text-lg">
              Real people. Real stuff. No nonsense.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/browse" className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90">
                Start browsing <ArrowRight size={16} />
              </Link>
              <Link to="/sell" className="inline-flex items-center gap-2 rounded-full border bg-card px-6 py-3 text-sm font-semibold transition hover:bg-muted">
                Open a store
              </Link>
            </div>
          </div>
          <div className="relative">
            {listings.length >= 4 ? (
              <div className="grid grid-cols-2 gap-3">
                {[0, 1, 2, 3].map((i) => (
                  <img
                    key={i}
                    src={listings[i].image_urls[0] ?? "https://images.unsplash.com/photo-1481349518771-20055b2a7b24?w=600&q=70"}
                    alt=""
                    className={`aspect-[3/4] w-full rounded-2xl object-cover ${i % 2 ? "mt-8" : ""}`}
                  />
                ))}
              </div>
            ) : (
              <div className="aspect-[4/5] w-full rounded-2xl bg-gradient-to-br from-primary/20 to-accent/30" />
            )}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <SectionHeader title="Shop by category" subtitle="Twenty-two honest aisles." />
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {categories.map((c) => <CategoryTile key={c.slug} category={c} />)}
        </div>
      </section>

      {/* Trending */}
      {trending.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <SectionHeader title="Fresh on the market" subtitle="The newest things sellers just put up." link={{ to: "/browse", label: "See all" }} />
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
            {trending.map((p) => <ListingCard key={p.id} listing={p} />)}
          </div>
        </section>
      )}

      {/* Editorial */}
      {drop.length >= 6 && (
        <section className="mx-auto mt-10 max-w-7xl px-4 sm:px-6">
          <div className="overflow-hidden rounded-3xl bg-foreground text-background">
            <div className="grid gap-6 p-8 md:grid-cols-2 md:p-12">
              <div>
                <span className="text-xs uppercase tracking-wider opacity-70">This week's drop</span>
                <h3 className="mt-3 font-display text-3xl font-bold md:text-4xl">Quietly excellent things, slightly under-priced.</h3>
                <p className="mt-3 max-w-md opacity-80">Fresh picks from indie sellers. New batch every week.</p>
                <Link to="/browse" className="mt-6 inline-flex items-center gap-2 rounded-full bg-background px-5 py-2.5 text-sm font-semibold text-foreground transition hover:opacity-90">
                  See the drop <ArrowRight size={14} />
                </Link>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {drop.map((p) => (
                  <img key={p.id} src={p.image_urls[0] ?? ""} alt="" className="aspect-square w-full rounded-xl object-cover" />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* More */}
      {fresh.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <SectionHeader title="More from the market" link={{ to: "/browse", label: "Browse all" }} />
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-6">
            {fresh.map((p) => <ListingCard key={p.id} listing={p} />)}
          </div>
        </section>
      )}

      {listings.length === 0 && (
        <section className="mx-auto max-w-2xl px-4 py-24 text-center">
          <h2 className="font-display text-3xl font-bold">The market's just opening.</h2>
          <p className="mt-3 text-muted-foreground">No listings yet — be the first to put something up.</p>
          <Link to="/sell" className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground">
            Open a store
          </Link>
        </section>
      )}
    </SiteShell>
  );
}

function SectionHeader({ title, subtitle, link }: { title: string; subtitle?: string; link?: { to: string; label: string } }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="font-display text-3xl font-bold">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {link && <Link to={link.to} className="text-sm font-medium underline-offset-4 hover:underline">{link.label} →</Link>}
    </div>
  );
}
