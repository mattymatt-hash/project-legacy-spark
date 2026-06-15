import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useState } from "react";
import { Heart, Truck, ShieldCheck, RotateCcw } from "lucide-react";
import { SiteShell } from "@/components/layout/SiteShell";
import { PriceTag } from "@/components/marketplace/PriceTag";
import { ListingCard } from "@/components/marketplace/ListingCard";
import { StarRow } from "@/components/marketplace/StarRating";
import { ListingReviews } from "@/components/marketplace/ReviewList";
import { getListingById, getActiveListings } from "@/lib/listings.functions";
import { useCart } from "@/lib/store/cart";
import { useFavorites } from "@/lib/store/favorites";
import { cn } from "@/lib/utils";
import { formatPrice, CONDITION_LABELS } from "@/lib/format";
import { toast } from "sonner";

const listingQuery = (id: string) =>
  queryOptions({
    queryKey: ["listing", id],
    queryFn: () => getListingById({ data: { id } }),
  });

const relatedQuery = (category: string) =>
  queryOptions({
    queryKey: ["listings", "related", category],
    queryFn: () => getActiveListings({ data: { category: category as any, limit: 8 } }),
  });

export const Route = createFileRoute("/product/$id")({
  loader: async ({ params, context }) => {
    const listing = await context.queryClient.ensureQueryData(listingQuery(params.id));
    if (!listing) throw notFound();
    return { listing };
  },
  head: ({ loaderData }) => {
    const p = loaderData?.listing;
    if (!p) return { meta: [{ title: "Product — NoBS Market" }] };
    const desc = (p.description || `${p.title} on NoBS Market.`).slice(0, 155);
    const image = p.image_urls[0];
    return {
      meta: [
        { title: `${p.title} — NoBS Market` },
        { name: "description", content: desc },
        { property: "og:title", content: p.title },
        { property: "og:description", content: desc },
        ...(image ? [{ property: "og:image", content: image }, { name: "twitter:image", content: image }] : []),
      ],
    };
  },
  notFoundComponent: () => (
    <SiteShell>
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="font-display text-3xl font-bold">Item not found</h1>
        <p className="mt-2 text-muted-foreground">It may have sold or been taken down.</p>
        <Link to="/browse" className="mt-6 inline-block rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
          Keep browsing
        </Link>
      </div>
    </SiteShell>
  ),
  errorComponent: ({ reset }) => (
    <SiteShell>
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="font-display text-2xl font-bold">Something broke</h1>
        <button onClick={reset} className="mt-4 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
          Try again
        </button>
      </div>
    </SiteShell>
  ),
  component: ProductPage,
});

function ProductPage() {
  const { id } = Route.useParams();
  const { data: listing } = useSuspenseQuery(listingQuery(id));
  if (!listing) return null;
  const { data: relatedRaw = [] } = useSuspenseQuery(relatedQuery(listing.category));
  const related = relatedRaw.filter((r) => r.id !== listing.id).slice(0, 4);

  const [activeImage, setActiveImage] = useState(0);
  const [qty, setQty] = useState(1);
  const { add } = useCart();
  const { has, toggle } = useFavorites();
  const favored = has(listing.id);
  const cover = listing.image_urls[activeImage] ?? listing.image_urls[0] ?? "https://images.unsplash.com/photo-1481349518771-20055b2a7b24?w=900&q=70";

  return (
    <SiteShell>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <nav className="mb-6 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <span className="mx-2">/</span>
          <Link to="/browse" search={{ category: listing.category }} className="capitalize hover:text-foreground">
            {listing.category}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{listing.title}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <div className="overflow-hidden rounded-3xl bg-muted">
              <img src={cover} alt={listing.title} className="aspect-square w-full object-cover" />
            </div>
            {listing.image_urls.length > 1 && (
              <div className="mt-3 flex gap-3">
                {listing.image_urls.map((src, i) => (
                  <button
                    key={src + i}
                    onClick={() => setActiveImage(i)}
                    className={cn(
                      "overflow-hidden rounded-xl border-2 transition",
                      i === activeImage ? "border-primary" : "border-transparent opacity-70 hover:opacity-100",
                    )}
                  >
                    <img src={src} alt="" className="h-20 w-20 object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {CONDITION_LABELS[listing.condition]}
            </span>
            <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">{listing.title}</h1>
            {listing.rating_count > 0 && (
              <div className="mt-2 flex items-center gap-2 text-sm">
                <StarRow value={Number(listing.rating_avg)} />
                <span className="font-medium">{Number(listing.rating_avg).toFixed(1)}</span>
                <span className="text-muted-foreground">({listing.rating_count} review{listing.rating_count === 1 ? "" : "s"})</span>
              </div>
            )}
            <div className="mt-3 flex items-center gap-4">
              <PriceTag price={listing.price_cents} original={listing.original_price_cents ?? undefined} className="text-2xl" />
            </div>

            {listing.description && (
              <p className="mt-6 whitespace-pre-wrap text-base leading-relaxed text-muted-foreground">{listing.description}</p>
            )}

            <div className="mt-6 flex items-center gap-3">
              <div className="flex items-center rounded-full border bg-card">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid h-10 w-10 place-items-center text-lg hover:bg-muted rounded-l-full">−</button>
                <span className="w-10 text-center text-sm font-medium">{qty}</span>
                <button onClick={() => setQty((q) => q + 1)} className="grid h-10 w-10 place-items-center text-lg hover:bg-muted rounded-r-full">+</button>
              </div>
              <button
                onClick={() => {
                  add(listing.id, qty);
                  toast.success(`Added ${qty} to cart`);
                }}
                disabled={listing.stock <= 0}
                className="flex-1 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
              >
                {listing.stock <= 0 ? "Sold out" : "Add to cart"}
              </button>
              <button
                onClick={() => toggle(listing.id)}
                aria-label="Favorite"
                className={cn("grid h-12 w-12 place-items-center rounded-full border bg-card transition hover:bg-muted", favored && "text-[var(--color-sale)]")}
              >
                <Heart size={18} className={favored ? "fill-current" : ""} />
              </button>
            </div>

            <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Truck size={16} /> {listing.shipping_cents > 0 ? `${formatPrice(listing.shipping_cents)} shipping` : "Free shipping"}
              </li>
              <li className="flex items-center gap-2"><RotateCcw size={16} /> 30-day returns, no questions</li>
              <li className="flex items-center gap-2"><ShieldCheck size={16} /> NoBS buyer protection</li>
            </ul>

            <Link
              to="/store/$handle"
              params={{ handle: listing.store.handle }}
              className="mt-8 flex items-center gap-3 rounded-2xl border bg-card p-4 transition hover:bg-muted"
            >
              <div className="grid h-12 w-12 place-items-center overflow-hidden rounded-full bg-muted">
                {listing.store.logo_url ? (
                  <img src={listing.store.logo_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="font-display text-lg">{listing.store.name[0]}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display font-semibold">{listing.store.name}</p>
                <p className="text-xs text-muted-foreground">@{listing.store.handle}</p>
              </div>
              <span className="text-sm font-medium">Visit store →</span>
            </Link>
          </div>
        </div>

        <section className="mt-16">
          <h2 className="font-display text-2xl font-bold">Reviews</h2>
          <div className="mt-6">
            <ListingReviews listingId={listing.id} />
          </div>
        </section>

        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="font-display text-2xl font-bold">You might also like</h2>
            <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
              {related.map((p) => <ListingCard key={p.id} listing={p} />)}
            </div>
          </section>
        )}
      </div>
    </SiteShell>
  );
}
