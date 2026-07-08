import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { SiteShell } from "@/components/layout/SiteShell";
import { ListingCard } from "@/components/marketplace/ListingCard";
import { ListingGrid as ListingGridSkeleton } from "@/components/marketplace/skeletons";
import { getActiveListings } from "@/lib/listings.functions";
import { categories } from "@/lib/mock/data";

const searchSchema = z.object({
  category: z.enum(["vintage", "handmade", "home", "fashion", "art", "collectibles"]).optional(),
  q: z.string().optional(),
});

const listQuery = (deps: { category?: string; q?: string; sort: "new" | "low" | "high" }) =>
  queryOptions({
    queryKey: ["listings", "browse", deps],
    queryFn: () =>
      getActiveListings({
        data: { category: deps.category as any, q: deps.q, sort: deps.sort, limit: 48 },
      }),
  });

export const Route = createFileRoute("/browse")({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ category: search.category, q: search.q }),
  loader: ({ context, deps }) =>
    context.queryClient.ensureQueryData(listQuery({ ...deps, sort: "new" })),
  head: () => ({
    meta: [
      { title: "Browse — NoBS Market" },
      { name: "description", content: "Browse handmade, vintage, and indie goods on NoBS Market." },
    ],
  }),
  errorComponent: ({ error }) => (
    <SiteShell>
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="font-display text-2xl font-bold">Couldn't load listings</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
      </div>
    </SiteShell>
  ),
  notFoundComponent: () => <SiteShell><div className="p-12 text-center">Not found</div></SiteShell>,
  component: BrowsePage,
});

function BrowsePage() {
  const { category, q } = Route.useSearch();
  const [sort, setSort] = useState<"new" | "low" | "high">("new");
  const { data: listings } = useSuspenseQuery(listQuery({ category, q, sort }));

  const activeCategory = category ? categories.find((c) => c.slug === category) : null;

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
            <div>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Category</h3>
              <ul className="space-y-1.5 text-sm">
                <li>
                  <Link to="/browse" className={!category ? "font-semibold text-primary" : "text-muted-foreground hover:text-foreground"}>All</Link>
                </li>
                {categories.map((c) => (
                  <li key={c.slug}>
                    <Link
                      to="/browse"
                      search={{ category: c.slug }}
                      className={category === c.slug ? "font-semibold text-primary" : "text-muted-foreground hover:text-foreground"}
                    >
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">{listings.length} items</span>
              <label className="flex items-center gap-2">
                Sort:
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as typeof sort)}
                  className="rounded-full border bg-card px-3 py-1.5 text-sm outline-none"
                >
                  <option value="new">Newest</option>
                  <option value="low">Price: low to high</option>
                  <option value="high">Price: high to low</option>
                </select>
              </label>
            </div>
            {listings.length === 0 ? (
              <div className="rounded-2xl border bg-card p-12 text-center text-muted-foreground">
                Nothing here yet.{" "}
                <Link to="/sell" className="font-medium underline">
                  Open a store
                </Link>{" "}
                and be the first.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 xl:grid-cols-4">
                {listings.map((p) => <ListingCard key={p.id} listing={p} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
