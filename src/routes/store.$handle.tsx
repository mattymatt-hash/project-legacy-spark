import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { getStoreByHandle } from "@/lib/stores.functions";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";

const storeQuery = (handle: string) =>
  queryOptions({
    queryKey: ["store", handle],
    queryFn: () => getStoreByHandle({ data: { handle } }),
  });

export const Route = createFileRoute("/store/$handle")({
  loader: async ({ params, context }) => {
    const store = await context.queryClient.ensureQueryData(storeQuery(params.handle));
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
  component: StorePage,
});

function StorePage() {
  const { handle } = Route.useParams();
  const { data: store } = useSuspenseQuery(storeQuery(handle));
  if (!store) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div
          className="h-40 w-full rounded-xl bg-gradient-to-br from-primary/20 to-accent/30"
          style={store.banner_url ? { backgroundImage: `url(${store.banner_url})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
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
          </div>
        </div>
        {store.bio && <p className="mt-6 max-w-2xl text-muted-foreground">{store.bio}</p>}

        <section className="mt-10 rounded-lg border border-dashed bg-surface p-10 text-center text-muted-foreground">
          No products yet. Listings come in the next update.
        </section>
      </main>
      <Footer />
    </div>
  );
}
