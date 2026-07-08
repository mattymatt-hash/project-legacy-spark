import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { getStoreByHandle } from "@/lib/stores.functions";
import { getListingsByStore, type PublicListing } from "@/lib/listings.functions";
import { ListingCard } from "@/components/marketplace/ListingCard";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { StarRow } from "@/components/marketplace/StarRating";
import { StoreReviews } from "@/components/marketplace/ReviewList";
import { StorePageSkeleton } from "@/components/marketplace/skeletons";

const storeQuery = (handle: string) =>
  queryOptions({
    queryKey: ["store", handle],
    queryFn: () => getStoreByHandle({ data: { handle } }),
  });

const storeListingsQuery = (handle: string) =>
  queryOptions({
    queryKey: ["store", handle, "listings"],
    queryFn: () => getListingsByStore({ data: { handle } }),
  });

export const Route = createFileRoute("/store/$handle")({
  loader: async ({ params, context }) => {
    const [store] = await Promise.all([
      context.queryClient.ensureQueryData(storeQuery(params.handle)),
      context.queryClient.ensureQueryData(storeListingsQuery(params.handle)),
    ]);
    if (!store) throw notFound();
    return { store };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.store.name} — NoBS Market` },
          { name: "description", content: loaderData.store.bio ?? `Shop ${loaderData.store.name} on NoBS Market.` },
          { property: "og:title", content: `${loaderData.store.name} — NoBS Market` },
          { property: "og:description", content: loaderData.store.bio ?? `Shop ${loaderData.store.name} on NoBS Market.` },
          ...(loaderData.store.banner_url
            ? [{ property: "og:image", content: loaderData.store.banner_url }]
            : []),
        ]
      : [],
  }),
  notFoundComponent: () => (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="font-display text-3xl font-bold">Store not found</h1>
        <p className="mt-2 text-muted-foreground">That storefront doesn't exist.</p>
        <Button asChild className="mt-6"><Link to="/browse">Browse the market</Link></Button>
      </main>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-bold">Could not load store</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
      </main>
    </div>
  ),
  pendingComponent: () => (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <StorePageSkeleton />
      </main>
      <Footer />
    </div>
  ),
  component: StorePage,
});

function StorePage() {
  const { handle } = Route.useParams();
  const { data: store } = useSuspenseQuery(storeQuery(handle));
  const { data: listings = [] } = useSuspenseQuery(storeListingsQuery(handle));
  if (!store) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div
          className="h-40 w-full rounded-xl bg-gradient-to-br from-primary/20 to-accent/30"
          style={
            store.banner_url
              ? { backgroundImage: `url(${store.banner_url})`, backgroundSize: "cover", backgroundPosition: "center" }
              : undefined
          }
        />
        <div className="mt-6 flex items-end gap-4">
          <div className="grid h-20 w-20 place-items-center overflow-hidden rounded-full border-4 border-background bg-muted -mt-12">
            {store.logo_url ? (
              <img src={store.logo_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="font-display text-2xl">{store.name[0]}</span>
            )}
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold">{store.name}</h1>
            <p className="text-sm text-muted-foreground">@{store.handle}</p>
            {store.rating_count > 0 && (
              <div className="mt-1 flex items-center gap-2 text-sm">
                <StarRow value={Number(store.rating_avg)} />
                <span className="font-medium">{Number(store.rating_avg).toFixed(1)}</span>
                <span className="text-muted-foreground">({store.rating_count})</span>
              </div>
            )}
          </div>
        </div>
        {store.bio && <p className="mt-6 max-w-2xl text-muted-foreground">{store.bio}</p>}

        {listings.length === 0 ? (
          <section className="mt-10 rounded-lg border border-dashed bg-surface p-10 text-center text-muted-foreground">
            No listings yet.
          </section>
        ) : (
          <section className="mt-10 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
            {listings.map((l: PublicListing) => <ListingCard key={l.id} listing={l} />)}
          </section>
        )}

        <section className="mt-16">
          <h2 className="font-display text-2xl font-bold">Reviews</h2>
          <div className="mt-6"><StoreReviews handle={store.handle} /></div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
