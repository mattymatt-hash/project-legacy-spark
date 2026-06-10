import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { z } from "zod";
import { SiteShell } from "@/components/layout/SiteShell";
import { ProductCard } from "@/components/marketplace/ProductCard";
import { categories, products } from "@/lib/mock/data";
import type { CategorySlug } from "@/lib/mock/types";

const searchSchema = z.object({
  category: z.string().optional(),
  q: z.string().optional(),
});

export const Route = createFileRoute("/browse")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Browse — NoBS Market" },
      { name: "description", content: "Browse handmade, vintage, and indie goods on NoBS Market." },
      { property: "og:title", content: "Browse — NoBS Market" },
      { property: "og:description", content: "Browse handmade, vintage, and indie goods." },
    ],
  }),
  component: BrowsePage,
});

const conditions = ["New", "Like new", "Good", "Vintage"] as const;

function BrowsePage() {
  const { category, q } = Route.useSearch();
  const [priceMax, setPriceMax] = useState(500);
  const [cond, setCond] = useState<string[]>([]);
  const [sort, setSort] = useState<"featured" | "low" | "high" | "rated">("featured");

  const filtered = useMemo(() => {
    let list = [...products];
    if (category) list = list.filter((p) => p.category === category);
    if (q) {
      const needle = q.toLowerCase();
      list = list.filter((p) => p.title.toLowerCase().includes(needle) || p.tags.some((t) => t.includes(needle)));
    }
    list = list.filter((p) => p.price <= priceMax);
    if (cond.length) list = list.filter((p) => cond.includes(p.condition));
    if (sort === "low") list.sort((a, b) => a.price - b.price);
    else if (sort === "high") list.sort((a, b) => b.price - a.price);
    else if (sort === "rated") list.sort((a, b) => b.rating - a.rating);
    return list;
  }, [category, q, priceMax, cond, sort]);

  const activeCategory = category ? categories.find((c) => c.slug === (category as CategorySlug)) : null;

  return (
    <SiteShell>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <h1 className="font-display text-3xl font-bold sm:text-4xl">
            {activeCategory ? activeCategory.name : "Everything"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {activeCategory?.blurb ?? "Every honest thing for sale, in one place."}
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <Filter title="Category">
              <ul className="space-y-1.5 text-sm">
                <li>
                  <Link to="/browse" className={!category ? "font-semibold text-primary" : "text-muted-foreground hover:text-foreground"}>All</Link>
                </li>
                {categories.map((c) => (
                  <li key={c.slug}>
                    <Link to="/browse" search={{ category: c.slug }} className={category === c.slug ? "font-semibold text-primary" : "text-muted-foreground hover:text-foreground"}>
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </Filter>

            <Filter title="Price">
              <input type="range" min={20} max={500} step={10} value={priceMax} onChange={(e) => setPriceMax(Number(e.target.value))} className="w-full accent-[var(--color-primary)]" />
              <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                <span>$0</span><span>Up to ${priceMax}</span>
              </div>
            </Filter>

            <Filter title="Condition">
              <ul className="space-y-2 text-sm">
                {conditions.map((c) => (
                  <li key={c}>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={cond.includes(c)} onChange={() => setCond((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c])} className="accent-[var(--color-primary)]" />
                      {c}
                    </label>
                  </li>
                ))}
              </ul>
            </Filter>
          </aside>

          <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">{filtered.length} items</span>
              <label className="flex items-center gap-2">
                Sort:
                <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="rounded-full border bg-card px-3 py-1.5 text-sm outline-none">
                  <option value="featured">Featured</option>
                  <option value="low">Price: low to high</option>
                  <option value="high">Price: high to low</option>
                  <option value="rated">Top rated</option>
                </select>
              </label>
            </div>
            {filtered.length === 0 ? (
              <div className="rounded-2xl border bg-card p-12 text-center text-muted-foreground">
                No items match those filters. Try widening the price or clearing condition.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 xl:grid-cols-4">
                {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </SiteShell>
  );
}

function Filter({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</h3>
      {children}
    </div>
  );
}
