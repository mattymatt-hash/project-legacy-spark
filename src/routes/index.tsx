import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/layout/SiteShell";
import { CategoryTile } from "@/components/marketplace/CategoryTile";
import { ProductCard } from "@/components/marketplace/ProductCard";
import { categories, products, sellers } from "@/lib/mock/data";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NoBS Market — Honest goods from real people" },
      { name: "description", content: "Discover handmade, vintage, and indie goods from sellers who care. No dropshippers, no drama." },
      { property: "og:title", content: "NoBS Market" },
      { property: "og:description", content: "Honest goods from real people." },
    ],
  }),
  component: Index,
});

function Index() {
  const trending = products.slice(0, 8);
  const fresh = products.slice(8, 14);
  const featuredSellers = sellers.slice(0, 4);

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
              Handmade, vintage, and indie goods from people who actually make them. No dropshippers. No fake reviews. No 47-step checkout.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/browse" className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90">
                Start browsing <ArrowRight size={16} />
              </Link>
              <Link to="/" className="inline-flex items-center gap-2 rounded-full border bg-card px-6 py-3 text-sm font-semibold transition hover:bg-muted">
                Open a store
              </Link>
            </div>
            <dl className="mt-10 grid max-w-md grid-cols-3 gap-4">
              {[["12k+", "Indie sellers"], ["180k", "Real items"], ["4.9★", "Avg rating"]].map(([n, l]) => (
                <div key={l}>
                  <dt className="font-display text-2xl font-bold">{n}</dt>
                  <dd className="text-xs text-muted-foreground">{l}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="relative">
            <div className="grid grid-cols-2 gap-3">
              <img src={products[0].images[0]} alt="" className="aspect-[3/4] w-full rounded-2xl object-cover" />
              <img src={products[3].images[0]} alt="" className="mt-8 aspect-[3/4] w-full rounded-2xl object-cover" />
              <img src={products[7].images[0]} alt="" className="aspect-[3/4] w-full rounded-2xl object-cover" />
              <img src={products[11].images[0]} alt="" className="mt-8 aspect-[3/4] w-full rounded-2xl object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <SectionHeader title="Shop by category" subtitle="Six honest aisles." />
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {categories.map((c) => <CategoryTile key={c.slug} category={c} />)}
        </div>
      </section>

      {/* Trending */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <SectionHeader title="Trending now" subtitle="What people are actually buying this week." link={{ to: "/browse", label: "See all" }} />
        <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
          {trending.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* Editorial */}
      <section className="mx-auto mt-10 max-w-7xl px-4 sm:px-6">
        <div className="overflow-hidden rounded-3xl bg-foreground text-background">
          <div className="grid gap-6 p-8 md:grid-cols-2 md:p-12">
            <div>
              <span className="text-xs uppercase tracking-wider opacity-70">This week's drop</span>
              <h3 className="mt-3 font-display text-3xl font-bold md:text-4xl">Quietly excellent things, slightly under-priced.</h3>
              <p className="mt-3 max-w-md opacity-80">Twelve picks from sellers we'd buy from regardless. Fresh batch every Sunday night.</p>
              <Link to="/browse" className="mt-6 inline-flex items-center gap-2 rounded-full bg-background px-5 py-2.5 text-sm font-semibold text-foreground transition hover:opacity-90">
                See the drop <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {products.slice(14, 20).map((p) => (
                <img key={p.id} src={p.images[0]} alt="" className="aspect-square w-full rounded-xl object-cover" />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Fresh from sellers */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <SectionHeader title="New from indie sellers" subtitle="Hot off the workbench." link={{ to: "/browse", label: "Browse all" }} />
        <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-6">
          {fresh.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* Sellers */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <SectionHeader title="Sellers worth following" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featuredSellers.map((s) => (
            <div key={s.id} className="rounded-2xl border bg-card p-5">
              <div className="flex items-center gap-3">
                <img src={s.avatar} alt={s.name} className="h-14 w-14 rounded-full object-cover" />
                <div className="min-w-0">
                  <h4 className="truncate font-display text-lg font-semibold">{s.name}</h4>
                  <p className="text-xs text-muted-foreground">{s.location}</p>
                </div>
              </div>
              <p className="mt-4 line-clamp-3 text-sm text-muted-foreground">{s.bio}</p>
              <div className="mt-4 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{s.sales.toLocaleString()} sales</span>
                <span className="font-medium">★ {s.rating.toFixed(1)}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
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
